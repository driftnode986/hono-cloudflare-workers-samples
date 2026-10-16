import { afterEach, describe, expect, it, vi } from 'vitest'
import logged from '../src/middleware-log'
import pathScoped from '../src/middleware-path'
import builtin from '../src/builtin-middleware'
import withTiming from '../src/with-timing'
import withPrefix from '../src/with-prefix-logger'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('middleware (1.5)', () => {
  it('logs method, URL and elapsed time after next()', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const res = await logged.request('/')
    expect(await res.text()).toBe('Hello!')
    expect(log).toHaveBeenCalledTimes(1)
    expect(String(log.mock.calls[0][0])).toMatch(
      /^GET http:\/\/localhost\/ - \d+ms$/,
    )
  })

  it('applies a path scoped middleware only under /api/*', async () => {
    const open = await pathScoped.request('/')
    expect(open.status).toBe(200)
    const denied = await pathScoped.request('/api/data')
    expect(denied.status).toBe(401)
    expect(await denied.json()).toEqual({ error: 'Unauthorized' })
    const allowed = await pathScoped.request('/api/data', {
      headers: { Authorization: 'Bearer x' },
    })
    expect(allowed.status).toBe(200)
    expect(await allowed.json()).toEqual({ items: [] })
  })

  it('combines logger, secureHeaders and cors', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const res = await builtin.request('/')
    expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')

    const api = await builtin.request('/api/data', {
      headers: { Origin: 'https://example.com' },
    })
    expect(api.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://example.com',
    )
    const pre = await builtin.request('/api/data', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://example.com',
        'Access-Control-Request-Method': 'PUT',
      },
    })
    expect(pre.status).toBe(204)
    expect(pre.headers.get('Access-Control-Allow-Methods')).toContain('PUT')
  })

  it('timing middleware adds X-Response-Time', async () => {
    const res = await withTiming.request('/')
    expect(res.headers.get('X-Response-Time')).toMatch(/^\d+ms$/)
    expect(await res.text()).toBe('Hello!')
  })

  it('prefixLogger logs with the given prefix', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const res = await withPrefix.request('/')
    expect(res.status).toBe(200)
    expect(log).toHaveBeenCalledWith('[APP] GET http://localhost/')
  })
})
