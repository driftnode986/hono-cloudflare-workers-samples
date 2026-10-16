// test/health.test.ts
import { env } from 'cloudflare:workers'
import { describe, it, expect } from 'vitest'
import { app } from '../src/index'

describe('Health check', () => {
  it('GET /health returns 200', async () => {
    const res = await app.request('/health', {}, env)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ status: 'ok' })
  })
})
