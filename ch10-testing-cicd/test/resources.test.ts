// #region resources-setup
// test/resources.test.ts
import { env } from 'cloudflare:workers'
import { applyD1Migrations } from 'cloudflare:test'
import { describe, it, expect, beforeAll } from 'vitest'
import { app } from '../src/index'
import { seedTenant } from './helpers/seed'

describe('Resources API', () => {
  beforeAll(async () => {
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
    await seedTenant(env.DB, 'tenant-1', 'sk_live_test_key')
  })
// #endregion

// #region resources-create
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
    const body = await res.json<{ id: string; title: string }>()
    expect(body.title).toBe('Test Resource')
  })
})
// #endregion
