// test/images.test.ts
import { env } from 'cloudflare:workers'
import { describe, it, expect } from 'vitest'
import app from '../src/index'

const upload = (body: BodyInit, type?: string) =>
  app.request('/images', {
    method: 'POST',
    body,
    headers: type ? { 'Content-Type': type } : {},
  }, env)

describe('POST /images', () => {
  it('stores an allowed image and returns a url that can be fetched', async () => {
    const bytes = new Uint8Array([137, 80, 78, 71, 1, 2, 3])
    const res = await upload(bytes, 'image/png')
    expect(res.status).toBe(201)
    const json = await res.json<{ key: string; size: number; url: string }>()
    expect(json.key).toMatch(/^images\/[0-9a-f-]{36}\.png$/)
    expect(json.size).toBe(7)
    expect(json.url).toBe(`/files/${json.key}`)

    const stored = await env.FILES_BUCKET.head(json.key)
    expect(stored?.httpMetadata?.contentType).toBe('image/png')
    expect(stored?.customMetadata?.uploadedAt).toBeTruthy()

    const got = await app.request(json.url, {}, env)
    expect(got.status).toBe(200)
    expect(new Uint8Array(await got.arrayBuffer())).toEqual(bytes)
  })

  it('maps image/jpeg to the .jpg extension', async () => {
    const res = await upload(new Uint8Array([1]), 'image/jpeg')
    const json = await res.json<{ key: string }>()
    expect(json.key.endsWith('.jpg')).toBe(true)
  })

  it('rejects an unsupported content type with 415', async () => {
    const res = await upload('hello', 'text/plain')
    expect(res.status).toBe(415)
    expect(await res.text()).toContain('Unsupported media type')
  })

  it('rejects a request without a content type with 415', async () => {
    const res = await app.request('/images', { method: 'POST' }, env)
    expect(res.status).toBe(415)
  })

  it('rejects a body over 5 MB with 413', async () => {
    const res = await upload(new Uint8Array(5 * 1024 * 1024 + 1), 'image/png')
    expect(res.status).toBe(413)
    expect(await res.text()).toContain('File too large')
  })
})
