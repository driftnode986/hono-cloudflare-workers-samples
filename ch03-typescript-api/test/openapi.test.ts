import { describe, expect, it } from 'vitest'
import app from '../src/index'

const json = { 'Content-Type': 'application/json' }
const ID = '550e8400-e29b-41d4-a716-446655440000'

describe('OpenAPI 版 src/index.ts', () => {
  it('GET /api/posts は 200 で記事の配列を返す', async () => {
    const res = await app.request('/api/posts')
    expect(res.status).toBe(200)
    const body = (await res.json()) as { posts: { id: string }[] }
    expect(body.posts).toHaveLength(1)
    expect(body.posts[0].id).toBe(ID)
  })

  it('POST /api/posts は検証を通ると 201 で作成結果を返す', async () => {
    const res = await app.request('/api/posts', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ title: 'New', body: 'Content' }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as Record<string, string>
    expect(body.title).toBe('New')
    expect(body.body).toBe('Content')
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(Number.isNaN(Date.parse(body.createdAt))).toBe(false)
  })

  it('POST /api/posts は title が空だと 400 を返す', async () => {
    const res = await app.request('/api/posts', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ title: '', body: 'Content' }),
    })
    expect(res.status).toBe(400)
  })

  it('GET /api/posts/:id は UUID なら 200 で id をそのまま返す', async () => {
    const res = await app.request(`/api/posts/${ID}`)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { id: string; title: string }
    expect(body.id).toBe(ID)
    expect(body.title).toBe('Hello')
  })

  it('GET /api/posts/:id は UUID でないと 400 を返す', async () => {
    const res = await app.request('/api/posts/not-a-uuid')
    expect(res.status).toBe(400)
  })

  it('GET /doc は 3 つの操作を含む OpenAPI 文書を返す', async () => {
    const res = await app.request('/doc')
    expect(res.status).toBe(200)
    const doc = (await res.json()) as {
      openapi: string
      info: { title: string }
      paths: Record<string, Record<string, unknown>>
    }
    expect(doc.openapi).toBe('3.0.0')
    expect(doc.info.title).toBe('Blog API')
    expect(Object.keys(doc.paths['/api/posts'])).toEqual(['get', 'post'])
    expect(Object.keys(doc.paths['/api/posts/{id}'])).toEqual(['get'])
  })
})
