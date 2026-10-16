// test/saas.test.ts
import { env } from 'cloudflare:workers'
import { describe, it, expect, beforeAll } from 'vitest'
import worker from '../src/index'
import type { JobMessage } from '../src/queue'
import { hashKey } from '../src/routes/api-keys'

const RAW_KEY = 'sk_live_test_key_for_tenant_a'
const OTHER_KEY = 'sk_live_test_key_for_tenant_b'

async function seed(tenantId: string, plan: string, rawKey: string) {
  await env.DB.prepare('INSERT INTO tenants (id, name, plan) VALUES (?, ?, ?)')
    .bind(tenantId, tenantId, plan)
    .run()
  await env.DB.prepare(
    'INSERT INTO api_keys (id, tenant_id, key_hash, key_prefix, name) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(`key-${tenantId}`, tenantId, await hashKey(rawKey), rawKey.slice(0, 16), 'seed')
    .run()
}

function call(path: string, key: string | null, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (key) headers.set('Authorization', `Bearer ${key}`)
  return worker.fetch(new Request(`http://localhost${path}`, { ...init, headers }), env)
}

const post = (path: string, key: string, body: unknown) =>
  call(path, key, { method: 'POST', body: JSON.stringify(body) })

describe('SaaS MVP API', () => {
  beforeAll(async () => {
    await seed('tenant-a', 'free', RAW_KEY)
    await seed('tenant-b', 'pro', OTHER_KEY)
  })

  it('GET /health is public', async () => {
    const res = await call('/health', null)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })

  it('rejects requests without an API key', async () => {
    const res = await call('/api/resources', null)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'API key required' })
  })

  it('rejects an unknown API key', async () => {
    const res = await call('/api/resources', 'sk_live_unknown')
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Invalid API key' })
  })

  it('updates last_used_at when a key is used', async () => {
    await call('/api/resources', RAW_KEY)
    const row = await env.DB.prepare(
      'SELECT last_used_at FROM api_keys WHERE id = ?'
    )
      .bind('key-tenant-a')
      .first<{ last_used_at: string | null }>()
    expect(row?.last_used_at).not.toBeNull()
  })

  it('POST /api/keys issues a key whose hash is stored', async () => {
    const res = await post('/api/keys', RAW_KEY, { name: 'second' })
    expect(res.status).toBe(200)
    const body = await res.json<{ id: string; key: string; prefix: string; name: string }>()
    expect(body.key).toMatch(/^sk_live_[0-9a-f]{64}$/)
    expect(body.prefix).toBe(body.key.slice(0, 16))
    const row = await env.DB.prepare('SELECT key_hash FROM api_keys WHERE id = ?')
      .bind(body.id)
      .first<{ key_hash: string }>()
    expect(row?.key_hash).toBe(await hashKey(body.key))
    // the new key authenticates as the same tenant
    expect((await call('/api/resources', body.key)).status).toBe(200)
  })

  it('creates, lists and deletes resources per tenant', async () => {
    const created = await post('/api/resources', RAW_KEY, {
      title: 'First',
      content: 'Hello',
    })
    expect(created.status).toBe(201)
    const { id, title } = await created.json<{ id: string; title: string }>()
    expect(title).toBe('First')

    const list = await call('/api/resources', RAW_KEY)
    const { resources } = await list.json<{
      resources: { id: string; tenantId: string; createdAt: string }[]
    }>()
    expect(resources.map((r) => r.id)).toContain(id)
    expect(resources.every((r) => r.tenantId === 'tenant-a')).toBe(true)
    // created_at is a real timestamp, not the default expression text
    expect(resources[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2} /)

    const del = await call(`/api/resources/${id}`, RAW_KEY, { method: 'DELETE' })
    expect(del.status).toBe(200)
    expect(await del.json()).toEqual({ deleted: true })
  })

  it('isolates tenants: other tenants cannot see or delete a resource', async () => {
    const created = await post('/api/resources', RAW_KEY, { title: 'Private' })
    const { id } = await created.json<{ id: string }>()

    const list = await call('/api/resources', OTHER_KEY)
    const { resources } = await list.json<{ resources: { id: string }[] }>()
    expect(resources.map((r) => r.id)).not.toContain(id)

    const del = await call(`/api/resources/${id}`, OTHER_KEY, { method: 'DELETE' })
    expect(del.status).toBe(404)
    expect(await del.json()).toEqual({ error: 'Resource not found' })

    const still = await env.DB.prepare('SELECT id FROM resources WHERE id = ?')
      .bind(id)
      .first()
    expect(still).not.toBeNull()
  })

  it('returns 404 when deleting a missing resource', async () => {
    const res = await call('/api/resources/nope', RAW_KEY, { method: 'DELETE' })
    expect(res.status).toBe(404)
  })

  it('enforces the free plan daily quota with 429', async () => {
    const today = new Date().toISOString().slice(0, 10)
    await env.PLAN_KV.put(`usage:tenant-a:${today}`, '100')
    const res = await call('/api/resources', RAW_KEY)
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({
      error: 'Daily quota exceeded',
      limit: 100,
    })
    // pro tenant is unaffected
    expect((await call('/api/resources', OTHER_KEY)).status).toBe(200)
  })

  it('counts requests in KV', async () => {
    const today = new Date().toISOString().slice(0, 10)
    await env.PLAN_KV.put(`usage:tenant-b:${today}`, '5')
    await call('/api/resources', OTHER_KEY)
    expect(await env.PLAN_KV.get(`usage:tenant-b:${today}`)).toBe('6')
  })

  it('queue consumer acknowledges audit messages', async () => {
    const acked: string[] = []
    const message = (id: string, body: JobMessage) =>
      ({ id, body, ack: () => acked.push(id) }) as unknown as Message<JobMessage>
    const batch = {
      messages: [
        message('m1', { type: 'resource.created', tenantId: 't', resourceId: 'r', timestamp: 'x' }),
      ],
    } as unknown as MessageBatch<JobMessage>
    await worker.queue(batch, env)
    expect(acked).toEqual(['m1'])
  })
})
