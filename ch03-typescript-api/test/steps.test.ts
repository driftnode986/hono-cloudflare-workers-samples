import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { hc } from 'hono/client'
import zvalidator from '../src/index.zvalidator'
import validators from '../src/routes/posts.validators'
import envApp from '../src/index.env'
import factoryPosts from '../src/routes/posts.factory'
import routesIndex from '../src/index.routes'
import postsApp from '../src/routes/posts'
import usersApp from '../src/routes/users'
import meApp from '../src/routes/me'
import { authMiddleware } from '../src/middleware/auth'
import { requestId } from '../src/middleware/request-id'
import rpcApp, { type AppType } from '../steps/rpc/src/index'
import statusApp, { type AppType as StatusAppType } from '../steps/rpc-status/src/index'
import { fetchPost } from '../steps/rpc-status/client'
import { findPost } from '../steps/rpc-status/src/lib/find-post'

const json = { 'Content-Type': 'application/json' }
const post = (app: Hono<any, any, any>, path: string, body: unknown) =>
  app.request(path, { method: 'POST', headers: json, body: JSON.stringify(body) })

describe('3.1 zValidator（JSON ボディ）', () => {
  it('検証を通ると 201 で id を付けて返す', async () => {
    const res = await post(zvalidator, '/api/posts', { title: 'T', body: 'B' })
    expect(res.status).toBe(201)
    const data = (await res.json()) as Record<string, string>
    expect(data.title).toBe('T')
    expect(data.id).toHaveLength(36)
  })

  it('title が無いとハンドラに到達せず 400 を返す', async () => {
    const res = await post(zvalidator, '/api/posts', { body: 'B' })
    expect(res.status).toBe(400)
  })

  it('Content-Type が無いと検証に失敗する（本文の Pitfall）', async () => {
    const res = await zvalidator.request('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'T', body: 'B' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('3.1 クエリ・パス・フック・複数バリデータ', () => {
  it('クエリは文字列から数値に変換され、省略時は既定値になる', async () => {
    const res = await validators.request('/api/posts?page=2&tag=hono')
    expect(await res.json()).toEqual({ page: 2, limit: 20, tag: 'hono', items: [] })
  })

  it('クエリが範囲外なら 400', async () => {
    const res = await validators.request('/api/posts?page=0')
    expect(res.status).toBe(400)
  })

  it('パスパラメータが UUID でなければ 400', async () => {
    const bad = await validators.request('/api/posts/abc')
    expect(bad.status).toBe(400)
    const ok = await validators.request(
      '/api/posts/550e8400-e29b-41d4-a716-446655440000'
    )
    expect(ok.status).toBe(200)
  })

  it('フック付きの POST は成功時に ok: true を返す', async () => {
    const res = await post(validators, '/api/posts', { title: 'T', body: 'B' })
    expect(res.status).toBe(201)
    const data = (await res.json()) as { ok: boolean; id: string }
    expect(data.ok).toBe(true)
    expect(data.id).toHaveLength(36)
  })

  it('フック付きの POST は失敗時に統一形式の 400 を返す', async () => {
    const res = await post(validators, '/api/posts', { title: '', body: 'B' })
    expect(res.status).toBe(400)
    const data = (await res.json()) as {
      ok: boolean
      errors: { path: string; message: string }[]
    }
    expect(data.ok).toBe(false)
    expect(data.errors.map((e) => e.path)).toContain('title')
  })

  it('PUT は param と json の両方を検証する', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440000'
    const res = await validators.request(`/api/posts/${id}`, {
      method: 'PUT',
      headers: json,
      body: JSON.stringify({ title: 'Updated' }),
    })
    expect(await res.json()).toEqual({ id, title: 'Updated' })
    const badId = await validators.request('/api/posts/x', {
      method: 'PUT',
      headers: json,
      body: JSON.stringify({ title: 'Updated' }),
    })
    expect(badId.status).toBe(400)
    const badBody = await validators.request(`/api/posts/${id}`, {
      method: 'PUT',
      headers: json,
      body: JSON.stringify({ title: '' }),
    })
    expect(badBody.status).toBe(400)
  })
})

describe('3.3 Env 型・createFactory', () => {
  it('createFactory のアプリは c.env.DB を参照できる', async () => {
    const env = { DB: {} }
    const res = await factoryPosts.request('/api/posts', {}, env)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ items: [] })
  })

  it('AppEnv を付けたアプリが作れる', () => {
    expect(envApp).toBeInstanceOf(Hono)
  })
})

describe('3.4 ミドルウェア', () => {
  it('authMiddleware は Authorization が無いと 401', async () => {
    const res = await meApp.request('/api/me')
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('authMiddleware は user を設定し、/api/me が返す', async () => {
    const res = await meApp.request('/api/me', {
      headers: { Authorization: 'Bearer token' },
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      user: { id: '1', email: 'user@example.com' },
    })
  })

  it('authMiddleware は単体でも使える', async () => {
    const app = new Hono().use(authMiddleware).get('/', (c) => c.text('ok'))
    expect((await app.request('/')).status).toBe(401)
  })

  it('requestId は c.var.requestId に UUID を入れる', async () => {
    const app = new Hono()
      .use(requestId)
      .get('/', (c) => c.json({ id: c.var.requestId }))
    const res = await app.request('/')
    const data = (await res.json()) as { id: string }
    expect(data.id).toMatch(/^[0-9a-f-]{36}$/)
  })
})

describe('3.5 RPC モード', () => {
  const client = hc<AppType>('http://localhost', {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      rpcApp.request(input, init),
  })

  it('GET /api/posts を型付きクライアントで呼べる', async () => {
    const res = await client.api.posts.$get()
    const { posts } = await res.json()
    expect(posts).toEqual([{ id: '1', title: 'Hello', body: 'World' }])
  })

  it('POST /api/posts は json を型検査し、201 を返す', async () => {
    const res = await client.api.posts.$post({
      json: { title: 'New Post', body: 'Content' },
    })
    expect(res.status).toBe(201)
    if (res.status === 201) {
      const created = await res.json()
      expect(created.title).toBe('New Post')
    }
  })

  it('GET /api/posts/:id は param を受け取る', async () => {
    const res = await client.api.posts[':id'].$get({ param: { id: '1' } })
    expect(await res.json()).toEqual({
      id: '1',
      title: 'Hello',
      body: 'World',
    })
  })
})

describe('3.5 ステータスコード別の型分岐', () => {
  const client = hc<StatusAppType>('http://localhost', {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      statusApp.request(input, init),
  })

  it('存在しない id は 404 と { error } になる', async () => {
    const res = await client.api.posts[':id'].$get({ param: { id: '999' } })
    expect(res.status).toBe(404)
    if (res.status === 404) {
      expect(await res.json()).toEqual({ error: 'Post not found' })
    }
  })

  it('存在する id は 200 と { post } になる', async () => {
    const res = await client.api.posts[':id'].$get({ param: { id: '1' } })
    expect(res.status).toBe(200)
    if (res.status === 200) {
      expect(await res.json()).toEqual({ post: findPost('1') })
    }
  })

  it('client.ts の分岐コードは localhost:8787 に向けて fetch を呼ぶ', async () => {
    const calls: string[] = []
    const original = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      calls.push(String(input))
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: json,
      })
    }) as typeof fetch
    try {
      await fetchPost('999')
    } finally {
      globalThis.fetch = original
    }
    expect(calls).toEqual(['http://localhost:8787/api/posts/999'])
  })
})

describe('3.5 app.route() で分割', () => {
  it('/api/posts と /api/users に合成される', async () => {
    expect(await (await routesIndex.request('/api/posts')).json()).toEqual({
      posts: [],
    })
    expect(await (await routesIndex.request('/api/users')).json()).toEqual({
      users: [],
    })
  })

  it('サブアプリ単体でも動く', async () => {
    const res = await postsApp.request('/', { method: 'POST' })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: '1' })
    expect(await (await usersApp.request('/')).json()).toEqual({ users: [] })
  })
})

describe('3.1 posts.ts を index.ts から app.route("/") でつなぐ', () => {
  it('つないだ app で 400 と 201 が返る', async () => {
    const app = new Hono()
    app.route('/', validators)
    const bad = await post(app, '/api/posts', { title: '', body: 'B' })
    expect(bad.status).toBe(400)
    const ok = await post(app, '/api/posts', { title: 'T', body: 'B' })
    expect(ok.status).toBe(201)
  })
})

describe('3.6 Zod 4 の z.uuid() / z.iso.datetime()', () => {
  it('UUID と ISO 日時の形式を検証する', async () => {
    const { PostSchema } = await import('../src/schemas/post')
    const good = PostSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 't',
      body: 'b',
      createdAt: '2026-05-01T00:00:00Z',
    })
    expect(good.success).toBe(true)
    const bad = PostSchema.safeParse({ id: 'x', title: 't', body: 'b', createdAt: 'x' })
    expect(bad.success).toBe(false)
  })
})
