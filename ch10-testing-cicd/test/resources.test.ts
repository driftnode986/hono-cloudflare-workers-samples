// test/resources.test.ts
import { env } from 'cloudflare:workers'
import { applyD1Migrations } from 'cloudflare:test'
import { describe, it, expect, beforeAll } from 'vitest'
import app from '../src/index'

describe('Resources API', () => {
  beforeAll(async () => {
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
  })

  it('POST /api/resources creates a resource', async () => {
    const res = await app.request(
      '/api/resources',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer sk_live_test_key',
        },
        body: JSON.stringify({
          title: 'Test Resource',
          content: 'Hello',
        }),
      },
      env
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.title).toBe('Test Resource')
  })
})
