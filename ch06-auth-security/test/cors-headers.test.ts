// test/cors-headers.test.ts
import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import app from '../src/index'
import { corsConfig } from '../src/middleware/cors-config'
import corsMulti from '../src/examples/cors-multi-origin'
import headersCustom from '../src/examples/secure-headers-custom'
import csp from '../src/examples/csp'
import { call } from './helpers'

describe('cors on /api/* (production setting)', () => {
  it('answers a preflight request with the configured policy', async () => {
    const res = await call(app, '/api/ping', {
      method: 'OPTIONS',
      headers: {
        'CF-Connecting-IP': '10.1.0.1',
        Origin: 'https://myapp.example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Authorization',
      },
    })
    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://myapp.example.com')
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET,POST,PUT,DELETE')
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type,Authorization')
    expect(res.headers.get('Access-Control-Max-Age')).toBe('86400')
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true')
  })

  it('adds the origin and exposed headers to a normal response', async () => {
    const res = await call(app, '/api/ping', {
      headers: { 'CF-Connecting-IP': '10.1.0.2', Origin: 'https://myapp.example.com' },
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ pong: true })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://myapp.example.com')
    expect(res.headers.get('Access-Control-Expose-Headers')).toBe('X-Total-Count')
  })
})

describe('corsConfig (per environment)', () => {
  const cors = new Hono<{ Bindings: { ENVIRONMENT: string; ALLOWED_ORIGIN: string } }>()
  cors.use(corsConfig)
  cors.get('/', (c) => c.text('ok'))
  const get = (origin: string, bindings: object) =>
    call(cors, '/', { headers: { Origin: origin } }, bindings)

  it('reflects any origin in development', async () => {
    const res = await get('http://anywhere.test', { ENVIRONMENT: 'development', ALLOWED_ORIGIN: 'http://localhost:3000' })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://anywhere.test')
  })

  it('allows only ALLOWED_ORIGIN in production', async () => {
    const prod = { ENVIRONMENT: 'production', ALLOWED_ORIGIN: 'https://myapp.example.com' }
    const ok = await get('https://myapp.example.com', prod)
    expect(ok.headers.get('Access-Control-Allow-Origin')).toBe('https://myapp.example.com')
    expect(ok.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    const ng = await get('https://evil.example.com', prod)
    expect(ng.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })
})

describe('cors with several origins', () => {
  it('allows each listed origin and no other', async () => {
    const get = (origin: string) => call(corsMulti, '/api/ping', { headers: { Origin: origin } })
    expect((await get('https://app.example.com')).headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.com')
    expect((await get('https://admin.example.com')).headers.get('Access-Control-Allow-Origin')).toBe('https://admin.example.com')
    expect((await get('https://other.example.com')).headers.get('Access-Control-Allow-Origin')).toBeNull()
  })
})

describe('secureHeaders', () => {
  it('sets the default headers listed in 6.6', async () => {
    const res = await call(app, '/api/ping', { headers: { 'CF-Connecting-IP': '10.1.0.3' } })
    expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=15552000; includeSubDomains')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
    expect(res.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin')
    expect(res.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin')
    expect(res.headers.get('Referrer-Policy')).toBe('no-referrer')
    expect(res.headers.get('X-XSS-Protection')).toBe('0')
    expect(res.headers.get('X-Powered-By')).toBeNull()
  })

  it('can drop X-Frame-Options and override Strict-Transport-Security', async () => {
    const res = await call(headersCustom, '/')
    expect(res.headers.get('X-Frame-Options')).toBeNull()
    expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=63072000; includeSubDomains; preload')
  })

  it('emits the Content-Security-Policy directives', async () => {
    const res = await call(csp, '/')
    const policy = res.headers.get('Content-Security-Policy')!
    expect(policy).toContain("default-src 'self'")
    expect(policy).toContain("script-src 'self' https://cdn.example.com")
    expect(policy).toContain("style-src 'self' 'unsafe-inline'")
    expect(policy).toContain("img-src 'self' data: https:")
  })
})
