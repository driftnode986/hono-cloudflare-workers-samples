// test/session.test.ts
import { env } from 'cloudflare:workers'
import { describe, it, expect } from 'vitest'
import app from '../src/index'

describe('session with KV', () => {
  it('POST /login creates a session in KV with a 24 hour TTL', async () => {
    const res = await app.request('/login', { method: 'POST' }, env)
    expect(res.status).toBe(200)
    const { sessionId } = await res.json<{ sessionId: string }>()
    expect(sessionId).toMatch(/^[0-9a-f-]{36}$/)

    const stored = await env.SESSION_KV.get(`session:${sessionId}`, 'json')
    expect(stored).toMatchObject({ userId: 'user-1', role: 'admin' })

    const { keys } = await env.SESSION_KV.list({ prefix: 'session:' })
    const ttl = keys.find((k) => k.name === `session:${sessionId}`)!.expiration!
    const left = ttl - Date.now() / 1000
    expect(left).toBeGreaterThan(86400 - 120)
    expect(left).toBeLessThanOrEqual(86400)
  })

  it('POST /logout deletes the session identified by X-Session-Id', async () => {
    const login = await app.request('/login', { method: 'POST' }, env)
    const { sessionId } = await login.json<{ sessionId: string }>()

    const res = await app.request('/logout', {
      method: 'POST',
      headers: { 'X-Session-Id': sessionId },
    }, env)
    expect(res.status).toBe(204)
    expect(await env.SESSION_KV.get(`session:${sessionId}`)).toBeNull()
  })

  it('POST /logout without a session id still returns 204', async () => {
    const res = await app.request('/logout', { method: 'POST' }, env)
    expect(res.status).toBe(204)
  })
})
