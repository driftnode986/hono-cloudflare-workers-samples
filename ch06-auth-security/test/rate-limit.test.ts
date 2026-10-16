// test/rate-limit.test.ts
import { env } from 'cloudflare:workers'
import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import app from '../src/index'
import byUser from '../src/steps/rate-limit-by-user'
import { rateLimit } from '../src/middleware/rate-limit'
import { call, tokenFor, bearer } from './helpers'

const ping = (ip: string) =>
  call(app, '/api/ping', { headers: { 'CF-Connecting-IP': ip } })

describe('rateLimit on /api/*', () => {
  it('reports the limit and the remaining requests', async () => {
    const a = await ping('10.2.0.1')
    expect(a.headers.get('X-RateLimit-Limit')).toBe('100')
    expect(a.headers.get('X-RateLimit-Remaining')).toBe('99')
    const b = await ping('10.2.0.1')
    expect(b.headers.get('X-RateLimit-Remaining')).toBe('98')
  })

  it('counts each IP separately', async () => {
    await ping('10.2.0.2')
    await ping('10.2.0.2')
    const other = await ping('10.2.0.3')
    expect(other.headers.get('X-RateLimit-Remaining')).toBe('99')
  })

  it('returns 429 once the counter in KV reaches max', async () => {
    const windowId = Math.floor(Date.now() / 60000)
    await env.RATE_KV.put(`rate:10.2.0.4:${windowId}`, '100')
    const res = await ping('10.2.0.4')
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ error: 'Too many requests' })
  })
})

describe('rateLimit window', () => {
  const tiny = new Hono<{ Bindings: { RATE_KV: KVNamespace } }>()
  tiny.use(rateLimit({ windowMs: 60 * 1000, max: 2 }))
  tiny.get('/', (c) => c.text('ok'))

  it('allows max requests then blocks, and stores the counter with a TTL', async () => {
    const h = { headers: { 'CF-Connecting-IP': '10.2.1.1' } }
    expect((await call(tiny, '/', h)).status).toBe(200)
    expect((await call(tiny, '/', h)).status).toBe(200)
    expect((await call(tiny, '/', h)).status).toBe(429)
    const { keys } = await env.RATE_KV.list({ prefix: 'rate:10.2.1.1:' })
    expect(keys).toHaveLength(1)
    expect(await env.RATE_KV.get(keys[0].name)).toBe('2')
    expect(keys[0].expiration! - Date.now() / 1000).toBeGreaterThan(60)
  })
})

describe('rateLimit by user (steps/rate-limit-by-user)', () => {
  it('counts by the JWT subject instead of the IP', async () => {
    const alice = await tokenFor('alice', 'user')
    const bob = await tokenFor('bob', 'user')
    const get = (token: string, ip: string) =>
      call(byUser, '/api/ping', {
        headers: { ...bearer(token), 'CF-Connecting-IP': ip },
      })
    expect((await get(alice, '10.3.0.1')).headers.get('X-RateLimit-Remaining')).toBe('99')
    // IP が違っても同じユーザーなら同じカウンタ
    expect((await get(alice, '10.3.0.2')).headers.get('X-RateLimit-Remaining')).toBe('98')
    expect((await get(bob, '10.3.0.1')).headers.get('X-RateLimit-Remaining')).toBe('99')
  })

  it('still requires a valid token', async () => {
    const res = await call(byUser, '/api/ping')
    expect(res.status).toBe(401)
  })
})
