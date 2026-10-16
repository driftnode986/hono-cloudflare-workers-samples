// test/blog-api.test.ts
import { env } from 'cloudflare:workers'
import { applyD1Migrations } from 'cloudflare:test'
import { beforeAll, describe, expect, it } from 'vitest'
import app from '../src/index'

type Json = Record<string, any>

async function call(path: string, init: RequestInit = {}) {
  return app.request(path, init, env)
}

function json(method: string, body: unknown, token?: string): RequestInit {
  return {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }
}

let token = ''

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
})

describe('root', () => {
  it('GET / returns the health message', async () => {
    const res = await call('/')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'Blog API is running' })
  })

  it('unknown path returns 404 JSON', async () => {
    const res = await call('/nope')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not Found' })
  })
})

describe('auth', () => {
  it('POST /api/auth/register creates a user and returns a token', async () => {
    const res = await call('/api/auth/register', json('POST', {
      email: 'a@example.com', password: 'password123', name: 'Author A',
    }))
    expect(res.status).toBe(201)
    const body = (await res.json()) as Json
    expect(typeof body.token).toBe('string')
    expect(body.user).toMatchObject({ email: 'a@example.com', name: 'Author A' })
    token = body.token
  })

  it('rejects a duplicate email with 409', async () => {
    const res = await call('/api/auth/register', json('POST', {
      email: 'a@example.com', password: 'password123', name: 'Author A',
    }))
    expect(res.status).toBe(409)
  })

  it('rejects an invalid body with 400', async () => {
    const res = await call('/api/auth/register', json('POST', {
      email: 'not-an-email', password: 'short', name: '',
    }))
    expect(res.status).toBe(400)
  })

  it('POST /api/auth/login returns a token for valid credentials', async () => {
    const res = await call('/api/auth/login', json('POST', {
      email: 'a@example.com', password: 'password123',
    }))
    expect(res.status).toBe(200)
    expect(typeof ((await res.json()) as Json).token).toBe('string')
  })

  it('POST /api/auth/login returns 401 for a wrong password', async () => {
    const res = await call('/api/auth/login', json('POST', {
      email: 'a@example.com', password: 'wrong-password',
    }))
    expect(res.status).toBe(401)
  })
})

describe('posts', () => {
  const post = {
    title: 'First', slug: 'first-post', status: 'published',
    content: '## Hello\n\nこれは**最初の記事**です。', excerpt: 'sample',
  }

  it('POST /api/posts requires a token', async () => {
    const res = await call('/api/posts', json('POST', post))
    expect(res.status).toBe(401)
  })

  it('POST /api/posts creates a post', async () => {
    const res = await call('/api/posts', json('POST', post, token))
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ slug: 'first-post', title: 'First', status: 'published' })
  })

  it('POST /api/posts rejects a duplicate slug with 409', async () => {
    const res = await call('/api/posts', json('POST', post, token))
    expect(res.status).toBe(409)
  })

  it('POST /api/posts rejects an invalid slug with 400', async () => {
    const res = await call('/api/posts', json('POST', { ...post, slug: 'Bad Slug' }, token))
    expect(res.status).toBe(400)
  })

  it('GET /api/posts lists only published posts with pagination', async () => {
    await call('/api/posts', json('POST', { ...post, slug: 'draft-post', status: 'draft' }, token))
    const res = await call('/api/posts?page=1&limit=10')
    expect(res.status).toBe(200)
    const body = (await res.json()) as Json
    expect(body.posts.map((p: Json) => p.slug)).toEqual(['first-post'])
    expect(body.posts[0].authorName).toBe('Author A')
    expect(body.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 })
  })

  it('GET /api/posts/:slug returns the post', async () => {
    const res = await call('/api/posts/first-post')
    expect(res.status).toBe(200)
    const body = (await res.json()) as Json
    expect(body.title).toBe('First')
    expect(body.contentHtml).toBeUndefined()
  })

  it('GET /api/posts/:slug?format=html adds contentHtml', async () => {
    const res = await call('/api/posts/first-post?format=html')
    const body = (await res.json()) as Json
    expect(body.contentHtml).toContain('<h2>Hello</h2>')
    expect(body.contentHtml).toContain('<strong>最初の記事</strong>')
  })

  it('GET /api/posts/:slug returns 404 for an unknown slug', async () => {
    const res = await call('/api/posts/missing')
    expect(res.status).toBe(404)
  })

  it('PUT /api/posts/:slug updates the post', async () => {
    const res = await call('/api/posts/first-post', json('PUT', { title: 'Renamed' }, token))
    expect(res.status).toBe(200)
    expect(((await res.json()) as Json).title).toBe('Renamed')
  })

  it('PUT /api/posts/:slug returns 404 for another author', async () => {
    const reg = await call('/api/auth/register', json('POST', {
      email: 'b@example.com', password: 'password123', name: 'Author B',
    }))
    const other = ((await reg.json()) as Json).token
    const res = await call('/api/posts/first-post', json('PUT', { title: 'Hijack' }, other))
    expect(res.status).toBe(404)
  })

  it('DELETE /api/posts/:slug removes the post', async () => {
    const res = await call('/api/posts/draft-post', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'Post deleted' })
    expect((await call('/api/posts/draft-post')).status).toBe(404)
  })
})

describe('images', () => {
  const auth = () => ({ Authorization: `Bearer ${token}` })

  function form(file: File) {
    const fd = new FormData()
    fd.append('image', file)
    return fd
  }

  it('POST /api/images/:slug/image uploads a cover and GET serves it', async () => {
    const png = new File([new Uint8Array([137, 80, 78, 71])], 'cover.png', { type: 'image/png' })
    const res = await call('/api/images/first-post/image', { method: 'POST', headers: auth(), body: form(png) })
    expect(res.status).toBe(201)
    const { key } = (await res.json()) as Json
    expect(key).toMatch(/^covers\/first-post\/\d+-cover\.png$/)

    const got = await call(`/api/images/file/${key}`)
    expect(got.status).toBe(200)
    expect(got.headers.get('content-type')).toBe('image/png')
    expect(got.headers.get('cache-control')).toBe('public, max-age=86400')
    expect(new Uint8Array(await got.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]))
  })

  it('rejects an unsupported type with 400', async () => {
    const gif = new File([new Uint8Array([1])], 'a.gif', { type: 'image/gif' })
    const res = await call('/api/images/first-post/image', { method: 'POST', headers: auth(), body: form(gif) })
    expect(res.status).toBe(400)
  })

  it('rejects a request without a file with 400', async () => {
    const res = await call('/api/images/first-post/image', { method: 'POST', headers: auth(), body: new FormData() })
    expect(res.status).toBe(400)
  })

  it('GET /api/images/file/* returns 404 for a missing key', async () => {
    expect((await call('/api/images/file/covers/none.png')).status).toBe(404)
  })

  it('requires a token', async () => {
    const png = new File([new Uint8Array([1])], 'c.png', { type: 'image/png' })
    const res = await call('/api/images/first-post/image', { method: 'POST', body: form(png) })
    expect(res.status).toBe(401)
  })
})
