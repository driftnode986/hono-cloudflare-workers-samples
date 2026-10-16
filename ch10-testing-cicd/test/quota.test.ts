// test/quota.test.ts
import { env } from 'cloudflare:workers'
import { applyD1Migrations } from 'cloudflare:test'
import { describe, it, expect, beforeAll } from 'vitest'
import { app } from '../src/index'
import { seedTenant } from './helpers/seed'

const today = new Date().toISOString().slice(0, 10)
const headers = { Authorization: 'Bearer sk_live_quota_key' }

describe('Quota', () => {
  beforeAll(async () => {
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
    await seedTenant(env.DB, 'tenant-quota', 'sk_live_quota_key')
  })

  it('free プランの 1 日の上限 (100 回) を超えると 429', async () => {
    await env.PLAN_KV.put(`usage:tenant-quota:${today}`, '100')
    const res = await app.request('/api/resources', { headers }, env)
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({
      error: 'Daily quota exceeded',
      limit: 100,
    })
  })
})
