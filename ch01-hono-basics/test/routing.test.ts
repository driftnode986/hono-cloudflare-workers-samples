import { describe, expect, it } from 'vitest'
import hello from '../src/hello'
import routing from '../src/routing'
import routingOn from '../src/routing-on'
import params from '../src/routing-params'
import mounted from '../src/route-mount'

describe('hello', () => {
  it('GET / returns Hello Hono!', async () => {
    const res = await hello.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Hello Hono!')
  })
})

describe('routing (1.3)', () => {
  it('maps each HTTP method to its own handler', async () => {
    expect(await (await routing.request('/')).text()).toBe('GET /')
    const post = await routing.request('/posts', { method: 'POST' })
    expect(await post.text()).toBe('POST /posts')
    const put = await routing.request('/posts/7', { method: 'PUT' })
    expect(await put.text()).toBe('PUT /posts/:id')
    const del = await routing.request('/posts/7', { method: 'DELETE' })
    expect(await del.text()).toBe('DELETE /posts/:id')
  })

  it('app.all matches every method', async () => {
    for (const method of ['GET', 'POST', 'PATCH']) {
      const res = await routing.request('/health', { method })
      expect(await res.text()).toBe('OK')
    }
  })

  it('app.on handles several methods in one handler', async () => {
    const put = await routingOn.request('/posts/42', { method: 'PUT' })
    expect(await put.text()).toBe('PUT /posts/42')
    const del = await routingOn.request('/posts/42', { method: 'DELETE' })
    expect(await del.text()).toBe('DELETE /posts/42')
    const get = await routingOn.request('/posts/42')
    expect(get.status).toBe(404)
  })

  it('reads path parameters', async () => {
    const one = await params.request('/users/alice')
    expect(await one.text()).toBe('Hello alice')
    const many = await params.request('/posts/3/comments/9')
    expect(await many.json()).toEqual({ postId: '3', commentId: '9' })
  })

  it('handles the optional path parameter', async () => {
    expect(await (await params.request('/api/animals')).text()).toBe(
      'Type: all',
    )
    expect(await (await params.request('/api/animals/cat')).text()).toBe(
      'Type: cat',
    )
  })

  it('reads query parameters', async () => {
    const q = await params.request('/search?q=hono')
    expect(await q.json()).toEqual({ query: 'hono' })
    const none = await params.request('/search')
    expect(await none.json()).toEqual({})
    const tags = await params.request('/filter?tag=hono&tag=workers')
    expect(await tags.json()).toEqual({ tags: ['hono', 'workers'] })
  })

  it('matches a wildcard route', async () => {
    const res = await params.request('/files/a/b/c.txt')
    expect(await res.text()).toBe('Matched a file route')
  })

  it('mounts a sub app with app.route', async () => {
    expect(await (await mounted.request('/users')).json()).toEqual({
      users: [],
    })
    expect(await (await mounted.request('/users/5')).json()).toEqual({
      id: '5',
    })
    const created = await mounted.request('/users', { method: 'POST' })
    expect(created.status).toBe(201)
    expect(await created.json()).toEqual({ message: 'Created' })
  })
})
