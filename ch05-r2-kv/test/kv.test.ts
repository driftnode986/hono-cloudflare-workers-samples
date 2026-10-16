// test/kv.test.ts
import { env } from 'cloudflare:workers'
import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { describe, it, expect, beforeAll } from 'vitest'
import app from '../src/index'

const sql = [
  `CREATE TABLE posts (id text PRIMARY KEY, title text NOT NULL, body text NOT NULL, thumbnail_key text, created_at text NOT NULL)`,
]

beforeAll(async () => {
  for (const s of sql) await env.DB.prepare(s).run()
  await env.DB
    .prepare('INSERT INTO posts VALUES (?, ?, ?, ?, ?)')
    .bind('p1', 'First', 'Body', 'images/p1.png', '2026-05-27T00:00:00.000Z')
    .run()
})

const call = async (path: string, init?: RequestInit) => {
  const ctx = createExecutionContext()
  const res = await app.request(path, init, env, ctx)
  await waitOnExecutionContext(ctx)
  return res
}

describe('kvCache on GET /posts', () => {
  it('misses first, stores the response in KV, then hits', async () => {
    const first = await call('/posts')
    expect(first.status).toBe(200)
    expect(first.headers.get('X-Cache')).toBe('MISS')
    const body = await first.json<{ posts: { id: string; thumbnailKey: string }[] }>()
    expect(body.posts).toHaveLength(1)
    expect(body.posts[0]).toMatchObject({ id: 'p1', thumbnailKey: 'images/p1.png' })

    const stored = await env.CACHE_KV.get('cache:http://localhost/posts')
    expect(JSON.parse(stored!)).toEqual(body)

    // D1 を書き換えても、キャッシュが有効な間は古い結果が返る
    await env.DB.prepare('DELETE FROM posts').run()
    const second = await call('/posts')
    expect(second.headers.get('X-Cache')).toBe('HIT')
    expect(await second.json()).toEqual(body)
  })

  it('does not cache non-ok responses', async () => {
    // kvCache は c.res.ok のときだけ保存する。存在しないパスはキャッシュ対象外
    const res = await call('/no-such-route')
    expect(res.status).toBe(404)
    expect(await env.CACHE_KV.get('cache:http://localhost/no-such-route')).toBeNull()
  })
})

describe('KV examples (5.7)', () => {
  it('put examples store strings, JSON and TTL entries', async () => {
    const res = await call('/examples/kv-put', { method: 'POST' })
    expect(res.status).toBe(204)
    expect(await env.MY_KV.get('config:site-name')).toBe('My Blog')
    expect(await env.MY_KV.get('config:settings', 'json')).toEqual({
      postsPerPage: 10,
      theme: 'dark',
    })
    const { keys } = await env.MY_KV.list({ prefix: 'session:' })
    expect(keys[0].expiration).toBeGreaterThan(Date.now() / 1000)
    expect(await env.MY_KV.get('token:xyz')).toBe('refresh-token-value')
  })

  it('put-metadata and getWithMetadata round-trip the metadata', async () => {
    await call('/examples/kv-put-metadata', { method: 'POST' })
    const res = await call('/examples/kv-get-with-metadata')
    const json = await res.json<{
      value: { title: string }
      metadata: { author: string; tags: string[] }
    }>()
    expect(json.value.title).toBe('Draft')
    expect(json.metadata.author).toBe('makino')
    expect(json.metadata.tags).toEqual(['hono', 'workers'])
  })

  it('get returns each value type', async () => {
    await env.MY_KV.put('file:small-icon', new Uint8Array([1, 2, 3]))
    await env.MY_KV.put('file:large-data', 'stream me')
    const res = await call('/examples/kv-get')
    expect(await res.json()).toEqual({
      name: 'My Blog',
      settings: { postsPerPage: 10, theme: 'dark' },
      binary: 3,
      stream: true,
    })
  })

  it('list returns keys by prefix', async () => {
    const res = await call('/examples/kv-list')
    expect(await res.json()).toEqual({ keys: ['article:draft-1'] })
  })

  it('delete removes the key', async () => {
    expect(await env.MY_KV.get('session:abc123')).not.toBeNull()
    const res = await call('/examples/kv-delete', { method: 'DELETE' })
    expect(res.status).toBe(204)
    expect(await env.MY_KV.get('session:abc123')).toBeNull()
  })

  it('GET /config reads several keys in parallel', async () => {
    await env.MY_KV.put('config:theme', JSON.stringify({ name: 'dark' }))
    const res = await call('/config')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      'config:theme': { name: 'dark' },
      'config:locale': null,
      'config:timezone': null,
    })
  })
})
