import { describe, expect, it } from 'vitest'
import responses from '../src/responses'
import headers from '../src/headers'
import body from '../src/request-body'

describe('response methods (1.4)', () => {
  it('c.text / c.json / c.html set the content type', async () => {
    const text = await responses.request('/text')
    expect(text.headers.get('content-type')).toContain('text/plain')
    expect(await text.text()).toBe('Hello!')

    const json = await responses.request('/json')
    expect(json.headers.get('content-type')).toContain('application/json')
    expect(await json.json()).toEqual({ message: 'Hello!' })

    const html = await responses.request('/html')
    expect(html.headers.get('content-type')).toContain('text/html')
    expect(await html.text()).toBe('<h1>Hello!</h1>')
  })

  it('c.json accepts a status code', async () => {
    const res = await responses.request('/api/posts', { method: 'POST' })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ created: true })
  })

  it('c.redirect defaults to 302 and accepts 301', async () => {
    const old = await responses.request('/old-page')
    expect(old.status).toBe(302)
    expect(old.headers.get('location')).toBe('/new-page')
    const moved = await responses.request('/moved')
    expect(moved.status).toBe(301)
    expect(moved.headers.get('location')).toBe('/new-location')
  })

  it('c.header and c.status set the response headers', async () => {
    const res = await headers.request('/custom')
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Request-Id')).toBe('12345')
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(await res.json()).toEqual({ data: 'custom response' })
  })

  it('c.req.json parses the request body', async () => {
    const res = await body.request('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'T', content: 'C' }),
    })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      received: { title: 'T', content: 'C' },
    })
  })
})
