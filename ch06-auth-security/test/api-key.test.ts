// test/api-key.test.ts
import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import app from '../src/index'
import { multiApiKeyAuth } from '../src/middleware/multi-api-key'
import { call, bearer } from './helpers'

describe('POST /webhook/payment (apiKeyAuth)', () => {
  const post = (headers?: Record<string, string>) =>
    call(app, '/webhook/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ amount: 100 }),
    })

  it('returns 401 without an Authorization header', async () => {
    expect((await post()).status).toBe(401)
  })

  it('returns 401 for a wrong key', async () => {
    expect((await post(bearer('nope'))).status).toBe(401)
  })

  it('returns 200 for the configured API_KEY', async () => {
    const res = await post(bearer('test-api-key'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
  })
})

describe('multiApiKeyAuth', () => {
  const multi = new Hono<{ Bindings: { API_KEYS: string } }>()
  multi.use(multiApiKeyAuth)
  multi.get('/', (c) => c.text('ok'))

  it('accepts any key in the comma separated list', async () => {
    expect((await call(multi, '/', { headers: bearer('key-a') })).status).toBe(200)
    expect((await call(multi, '/', { headers: bearer('key-b') })).status).toBe(200)
  })

  it('rejects a key that is not in the list', async () => {
    expect((await call(multi, '/', { headers: bearer('key-c') })).status).toBe(401)
  })
})
