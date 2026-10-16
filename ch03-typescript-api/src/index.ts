// src/index.ts
import { OpenAPIHono } from '@hono/zod-openapi'
import { listPostsRoute, createPostRoute, getPostRoute } from './openapi-routes/posts'

const app = new OpenAPIHono()

app.openapi(listPostsRoute, (c) => {
  return c.json({
    posts: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Hello',
        body: 'World',
        createdAt: '2026-05-01T00:00:00Z',
      },
    ],
  })
})

app.openapi(createPostRoute, (c) => {
  const data = c.req.valid('json')
  return c.json({
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
  }, 201)
})

app.openapi(getPostRoute, (c) => {
  const { id } = c.req.valid('param')
  return c.json({
    id,
    title: 'Hello',
    body: 'World',
    createdAt: '2026-05-01T00:00:00Z',
  })
})

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    title: 'Blog API',
    version: '1.0.0',
    description: 'Hono + Cloudflare Workers で構築するブログ API',
  },
})

export default app
