// test/files.test.ts
import { env } from 'cloudflare:workers'
import { describe, it, expect } from 'vitest'
import app from '../src/index'
import step1 from '../src/steps/files.step1'

const put = (key: string, body: string, type = 'text/plain') =>
  app.request(`/files/${key}`, {
    method: 'PUT',
    body,
    headers: { 'Content-Type': type },
  }, env)

describe('R2 files', () => {
  it('PUT stores the object and returns 201 with key, size, etag', async () => {
    const res = await put('hello.txt', 'hello r2')
    expect(res.status).toBe(201)
    const json = await res.json<{ key: string; size: number; etag: string }>()
    expect(json.key).toBe('hello.txt')
    expect(json.size).toBe(8)
    expect(json.etag).toBeTruthy()
    expect(await (await env.FILES_BUCKET.get('hello.txt'))!.text()).toBe('hello r2')
  })

  it('GET returns the body with content-type, etag and cache-control', async () => {
    await put('get.txt', 'body here')
    const res = await app.request('/files/get.txt', {}, env)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('body here')
    expect(res.headers.get('content-type')).toContain('text/plain')
    expect(res.headers.get('etag')).toBeTruthy()
    expect(res.headers.get('cache-control')).toBe('public, max-age=86400')
  })

  it('GET returns 404 for a missing key', async () => {
    const res = await app.request('/files/missing.txt', {}, env)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'File not found' })
  })

  it('GET with a matching If-None-Match returns 304 without a body', async () => {
    await put('etag.txt', 'cache me')
    const first = await app.request('/files/etag.txt', {}, env)
    const etag = first.headers.get('etag')!
    const res = await app.request('/files/etag.txt', {
      headers: { 'If-None-Match': etag },
    }, env)
    expect(res.status).toBe(304)
    expect(await res.text()).toBe('')
  })

  it('GET with a different If-None-Match returns the body', async () => {
    await put('etag2.txt', 'fresh')
    const res = await app.request('/files/etag2.txt', {
      headers: { 'If-None-Match': '"deadbeef"' },
    }, env)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('fresh')
  })

  it('GET serves keys that contain slashes', async () => {
    await put('dir/nested/a.txt', 'nested')
    const res = await app.request('/files/dir/nested/a.txt', {}, env)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('nested')
  })

  it('/meta/:key returns headers only', async () => {
    await put('meta.txt', '12345')
    const res = await app.request('/meta/meta.txt', {}, env)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-length')).toBe('5')
    expect(res.headers.get('etag')).toBeTruthy()
    expect(await res.text()).toBe('')
  })

  it('/meta/:key returns 404 for a missing key', async () => {
    const res = await app.request('/meta/nope.txt', {}, env)
    expect(res.status).toBe(404)
  })

  it('HEAD /files/:key is served by the GET handler without a body', async () => {
    await put('head.txt', 'abc')
    const res = await app.request('/files/head.txt', { method: 'HEAD' }, env)
    expect(res.status).toBe(200)
    expect(res.headers.get('etag')).toBeTruthy()
    expect(await res.text()).toBe('')
  })

  it('DELETE removes the object and returns 204', async () => {
    await put('del.txt', 'bye')
    const res = await app.request('/files/del.txt', { method: 'DELETE' }, env)
    expect(res.status).toBe(204)
    expect(await env.FILES_BUCKET.get('del.txt')).toBeNull()
  })

  it('list returns keys filtered by prefix and paginates with cursor', async () => {
    for (const n of ['a', 'b', 'c']) await put(`list/${n}.txt`, n)
    await put('other/x.txt', 'x')
    const page1 = await app.request('/files?prefix=list/&limit=2', {}, env)
    const j1 = await page1.json<{
      objects: { key: string; size: number }[]
      truncated: boolean
      cursor?: string
    }>()
    expect(j1.objects.map((o) => o.key)).toEqual(['list/a.txt', 'list/b.txt'])
    expect(j1.truncated).toBe(true)
    expect(j1.cursor).toBeTruthy()

    const page2 = await app.request(
      `/files?prefix=list/&limit=2&cursor=${encodeURIComponent(j1.cursor!)}`,
      {},
      env
    )
    const j2 = await page2.json<{ objects: { key: string }[]; truncated: boolean }>()
    expect(j2.objects.map((o) => o.key)).toEqual(['list/c.txt'])
    expect(j2.truncated).toBe(false)
  })

  it('delete-many example removes several keys at once', async () => {
    for (const n of [1, 2, 3, 4]) await put(`image-${n}.png`, 'x', 'image/png')
    const res = await app.request('/examples/r2-delete-many', { method: 'POST' }, env)
    expect(res.status).toBe(204)
    expect(await env.FILES_BUCKET.get('image-1.png')).toBeNull()
    expect(await env.FILES_BUCKET.get('image-3.png')).toBeNull()
    expect(await env.FILES_BUCKET.get('image-4.png')).not.toBeNull()
  })
})

describe('steps/files.step1 (the plain GET before conditional requests)', () => {
  it('returns the body and 404 for a missing key', async () => {
    await env.FILES_BUCKET.put('step.txt', 'plain')
    const ok = await step1.request('/files/step.txt', {}, env)
    expect(ok.status).toBe(200)
    expect(await ok.text()).toBe('plain')
    expect(ok.headers.get('etag')).toBeTruthy()
    const miss = await step1.request('/files/none.txt', {}, env)
    expect(miss.status).toBe(404)
  })
})
