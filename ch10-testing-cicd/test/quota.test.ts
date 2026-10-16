// test/quota.test.ts
import { env } from 'cloudflare:workers'
import { describe, it, expect } from 'vitest'

describe('Quota tracking', () => {
  it('increments usage counter in KV', async () => {
    const key = 'usage:tenant-1:2026-05-28'

    await env.PLAN_KV.put(key, '0', { expirationTtl: 86400 })
    const before = await env.PLAN_KV.get(key)
    expect(before).toBe('0')

    await env.PLAN_KV.put(key, '1', { expirationTtl: 86400 })
    const after = await env.PLAN_KV.get(key)
    expect(after).toBe('1')
  })
})
