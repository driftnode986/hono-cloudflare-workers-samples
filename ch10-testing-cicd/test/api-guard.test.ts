// 本文のテストが触れない、認証とクォータ上限の確認（本文には出さない）。
import { env } from 'cloudflare:workers'
import { applyD1Migrations } from 'cloudflare:test'
import { describe, it, expect, beforeAll } from 'vitest'
import { app } from '../src/index'
import { seedTenant } from './helpers/seed'

const KEY = 'sk_live_guard_test_key'
const today = () => new Date().toISOString().slice(0, 10)

function call(path: string, key: string | null, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (key) headers.set('Authorization', `Bearer ${key}`)
  return app.request(path, { ...init, headers }, env)
}

describe('API guard', () => {
  beforeAll(async () => {
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
    await seedTenant(env.DB, 'tenant-guard', KEY)
  })

  it('API キーが無いと 401', async () => {
    const res = await call('/api/resources', null)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'API key required' })
  })

  it('未登録の API キーは 401', async () => {
    const res = await call('/api/resources', 'sk_live_unknown')
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Invalid API key' })
  })

  it('作成したリソースを一覧で取得できる', async () => {
    const created = await call('/api/resources', KEY, {
      method: 'POST',
      body: JSON.stringify({ title: 'Listed' }),
    })
    const { id } = await created.json<{ id: string }>()
    const list = await call('/api/resources', KEY)
    const { resources } = await list.json<{ resources: { id: string }[] }>()
    expect(resources.map((r) => r.id)).toContain(id)
  })

  it('リクエストごとに KV の使用量カウンタが増える', async () => {
    const counter = `usage:tenant-guard:${today()}`
    await env.PLAN_KV.put(counter, '5')
    await call('/api/resources', KEY)
    expect(await env.PLAN_KV.get(counter)).toBe('6')
  })

  it('free プランの 1 日の上限（100 件）を超えると 429', async () => {
    await env.PLAN_KV.put(`usage:tenant-guard:${today()}`, '100')
    const res = await call('/api/resources', KEY)
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({
      error: 'Daily quota exceeded',
      limit: 100,
    })
  })
})
