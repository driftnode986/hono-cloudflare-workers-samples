import { env } from 'cloudflare:workers'
import { applyD1Migrations } from 'cloudflare:test'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/index'
import { createDb } from '../src/db'
import { posts, postTags, tags } from '../src/db/schema'

type Json = Record<string, any>

const call = (path: string, init: RequestInit = {}) =>
  app.request(path, init, env)

const send = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

async function createPost(slug: string, title = `Title ${slug}`) {
  const res = await call(
    '/api/posts',
    send('POST', { title, body: `Body ${slug}`, slug })
  )
  expect(res.status).toBe(201)
  return ((await res.json()) as Json).post as Json
}

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
})

beforeEach(async () => {
  const db = createDb(env.DB)
  await db.delete(postTags)
  await db.delete(tags)
  await db.delete(posts)
})

describe('スキーマとマイグレーション', () => {
  it('3 つのテーブルと 2 つの索引ができている', async () => {
    const { results } = await env.DB.prepare(
      "SELECT name, type FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' " +
        "AND name NOT LIKE '_cf_%' AND name <> 'd1_migrations' ORDER BY name"
    ).all<{ name: string; type: string }>()
    const names = results.map((r) => r.name)
    expect(names).toEqual(
      expect.arrayContaining([
        'posts',
        'tags',
        'post_tags',
        'posts_slug_idx',
        'posts_created_at_idx',
      ])
    )
  })

  it('id と日時の既定値が入る', async () => {
    const post = await createPost('defaults')
    expect(post.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(Number.isNaN(Date.parse(post.createdAt))).toBe(false)
    expect(post.updatedAt).toBeTruthy()
    expect(post.publishedAt).toBeNull()
  })

  it('slug は一意（重複する挿入は失敗する）', async () => {
    await createPost('dup')
    const db = createDb(env.DB)
    await expect(
      db.insert(posts).values({ title: 'x', body: 'y', slug: 'dup' })
    ).rejects.toThrow()
  })
})

describe('GET /api/posts', () => {
  it('空のときは items: [] と totalPages: 0', async () => {
    const res = await call('/api/posts')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })
  })

  it('ページネーションが効く（新しい順）', async () => {
    for (const s of ['a', 'b', 'c']) {
      await createPost(s)
      await new Promise((r) => setTimeout(r, 5))
    }
    const res = await call('/api/posts?limit=2&page=2')
    const body = (await res.json()) as Json
    expect(body.pagination).toEqual({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
    })
    expect(body.items.map((p: Json) => p.slug)).toEqual(['a'])
    const first = (await (await call('/api/posts?limit=2')).json()) as Json
    expect(first.items.map((p: Json) => p.slug)).toEqual(['c', 'b'])
  })

  it('search はタイトルの部分一致で絞り込み、total も絞った件数', async () => {
    await createPost('x1', 'Hono guide')
    await createPost('x2', 'Drizzle guide')
    await createPost('x3', 'Other')
    const body = (await (await call('/api/posts?search=guide')).json()) as Json
    expect(body.items).toHaveLength(2)
    expect(body.pagination.total).toBe(2)
  })

  it('limit が範囲外なら 400', async () => {
    expect((await call('/api/posts?limit=101')).status).toBe(400)
  })
})

describe('GET /api/posts/:id', () => {
  it('存在する記事を返す', async () => {
    const created = await createPost('one')
    const res = await call(`/api/posts/${created.id}`)
    expect(res.status).toBe(200)
    expect(((await res.json()) as Json).post.slug).toBe('one')
  })

  it('存在しない UUID は 404', async () => {
    const res = await call(`/api/posts/${crypto.randomUUID()}`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Post not found' })
  })

  it('UUID でなければ 400', async () => {
    expect((await call('/api/posts/abc')).status).toBe(400)
  })
})

describe('POST /api/posts', () => {
  it('作成して 201 と行を返し、D1 に保存される', async () => {
    const post = await createPost('saved', 'Saved')
    const rows = await createDb(env.DB).select().from(posts)
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(post.id)
    expect(rows[0].title).toBe('Saved')
  })

  it('slug の形式が違うと 400', async () => {
    const res = await call(
      '/api/posts',
      send('POST', { title: 't', body: 'b', slug: 'Bad Slug' })
    )
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/posts/:id', () => {
  it('指定した項目だけを更新し、updatedAt を進める', async () => {
    const created = await createPost('upd', 'Before')
    await new Promise((r) => setTimeout(r, 5))
    const res = await call(
      `/api/posts/${created.id}`,
      send('PUT', { title: 'After', publishedAt: '2026-05-01T00:00:00Z' })
    )
    expect(res.status).toBe(200)
    const post = ((await res.json()) as Json).post
    expect(post.title).toBe('After')
    expect(post.body).toBe(created.body)
    expect(post.publishedAt).toBe('2026-05-01T00:00:00Z')
    expect(post.updatedAt > created.updatedAt).toBe(true)
  })

  it('publishedAt に null を渡すと公開を取り消せる', async () => {
    const created = await createPost('unpub')
    await call(
      `/api/posts/${created.id}`,
      send('PUT', { publishedAt: '2026-05-01T00:00:00Z' })
    )
    const res = await call(
      `/api/posts/${created.id}`,
      send('PUT', { publishedAt: null })
    )
    expect(((await res.json()) as Json).post.publishedAt).toBeNull()
  })

  it('存在しない UUID は 404', async () => {
    const res = await call(
      `/api/posts/${crypto.randomUUID()}`,
      send('PUT', { title: 'x' })
    )
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/posts/:id', () => {
  it('削除でき、2 回目は 404', async () => {
    const created = await createPost('del')
    const res = await call(`/api/posts/${created.id}`, { method: 'DELETE' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'Deleted' })
    const again = await call(`/api/posts/${created.id}`, { method: 'DELETE' })
    expect(again.status).toBe(404)
    expect(await createDb(env.DB).select().from(posts)).toHaveLength(0)
  })
})

describe('タグ（リレーション）', () => {
  it('タグを付けて /:id/detail で名前の配列として取れる', async () => {
    const post = await createPost('tagged')
    const db = createDb(env.DB)
    const inserted = await db
      .insert(tags)
      .values([{ name: 'hono' }, { name: 'd1' }])
      .returning()

    const res = await call(
      `/api/posts/${post.id}/tags`,
      send('POST', { tagIds: inserted.map((t) => t.id) })
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'Tags added' })

    const detail = (await (await call(`/api/posts/${post.id}/detail`)).json()) as Json
    expect(detail.slug).toBe('tagged')
    expect([...detail.tags].sort()).toEqual(['d1', 'hono'])
  })

  it('同じタグを 2 回付けても行は 1 つ（複合主キー）', async () => {
    const post = await createPost('dup-tag')
    const db = createDb(env.DB)
    const [tag] = await db.insert(tags).values({ name: 'once' }).returning()
    for (let i = 0; i < 2; i++) {
      const res = await call(
        `/api/posts/${post.id}/tags`,
        send('POST', { tagIds: [tag.id] })
      )
      expect(res.status).toBe(200)
    }
    expect(await db.select().from(postTags)).toHaveLength(1)
    const detail = (await (await call(`/api/posts/${post.id}/detail`)).json()) as Json
    expect(detail.tags).toEqual(['once'])
  })

  it('tagIds が空配列なら 400', async () => {
    const post = await createPost('empty-ids')
    const res = await call(
      `/api/posts/${post.id}/tags`,
      send('POST', { tagIds: [] })
    )
    expect(res.status).toBe(400)
  })

  it('存在しないタグ ID は 400（外部キー違反の 500 にしない）', async () => {
    const post = await createPost('bad-tag')
    const res = await call(
      `/api/posts/${post.id}/tags`,
      send('POST', { tagIds: [9999] })
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Unknown tag' })
    expect(await createDb(env.DB).select().from(postTags)).toHaveLength(0)
  })

  it('存在しない記事へのタグ付けは 404', async () => {
    const res = await call(
      `/api/posts/${crypto.randomUUID()}/tags`,
      send('POST', { tagIds: [1] })
    )
    expect(res.status).toBe(404)
  })

  it('タグが無い記事は tags: []', async () => {
    const post = await createPost('plain')
    const detail = (await (await call(`/api/posts/${post.id}/detail`)).json()) as Json
    expect(detail.tags).toEqual([])
  })

  it('存在しない記事の detail は 404', async () => {
    const res = await call(`/api/posts/${crypto.randomUUID()}/detail`)
    expect(res.status).toBe(404)
  })
})

describe('POST /api/posts/with-tags（batch）', () => {
  it('記事とタグを 1 回のバッチで作る', async () => {
    const res = await call(
      '/api/posts/with-tags',
      send('POST', {
        title: 'Batch',
        body: 'Body',
        slug: 'batch',
        tagNames: ['alpha', 'beta'],
      })
    )
    expect(res.status).toBe(201)
    const post = ((await res.json()) as Json).post
    expect(post.slug).toBe('batch')

    const db = createDb(env.DB)
    expect(await db.select().from(posts)).toHaveLength(1)
    const names = (await db.select().from(tags)).map((t) => t.name).sort()
    expect(names).toEqual(['alpha', 'beta'])
  })

  it('作ったタグを記事に結びつけ、既存のタグは再利用する', async () => {
    const db = createDb(env.DB)
    await db.insert(tags).values({ name: 'alpha' })
    const res = await call(
      '/api/posts/with-tags',
      send('POST', {
        title: 'Linked',
        body: 'Body',
        slug: 'linked',
        tagNames: ['alpha', 'beta'],
      })
    )
    expect(res.status).toBe(201)
    const post = ((await res.json()) as Json).post
    expect(await db.select().from(tags)).toHaveLength(2)
    const detail = (await (await call(`/api/posts/${post.id}/detail`)).json()) as Json
    expect([...detail.tags].sort()).toEqual(['alpha', 'beta'])
  })

  it('tagNames が空でも記事だけ作れる', async () => {
    const res = await call(
      '/api/posts/with-tags',
      send('POST', { title: 'No tags', body: 'Body', slug: 'no-tags', tagNames: [] })
    )
    expect(res.status).toBe(201)
    const post = ((await res.json()) as Json).post
    const detail = (await (await call(`/api/posts/${post.id}/detail`)).json()) as Json
    expect(detail.tags).toEqual([])
  })

  it('slug が重複するとバッチ全体が失敗しタグも残らない', async () => {
    await createPost('taken')
    const res = await call(
      '/api/posts/with-tags',
      send('POST', {
        title: 'Batch',
        body: 'Body',
        slug: 'taken',
        tagNames: ['gamma'],
      })
    )
    expect(res.status).toBe(500)
    expect(await createDb(env.DB).select().from(tags)).toHaveLength(0)
  })

  it('tagNames が 6 個以上なら 400', async () => {
    const res = await call(
      '/api/posts/with-tags',
      send('POST', {
        title: 'Batch',
        body: 'Body',
        slug: 'many',
        tagNames: ['1', '2', '3', '4', '5', '6'],
      })
    )
    expect(res.status).toBe(400)
  })
})
