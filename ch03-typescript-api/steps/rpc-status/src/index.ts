// 3.5 の steps/rpc/src/index.ts の GET /api/posts/:id だけを置き換えたもの
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
// #region get-post-import
// src/index.ts の import に足す
import { findPost } from './lib/find-post'
// #endregion

const app = new Hono()

const createPostSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1),
})

const route = app
  .get('/api/posts', (c) => {
    return c.json({
      posts: [
        { id: '1', title: 'Hello', body: 'World' },
      ],
    })
  })
  .post(
    '/api/posts',
    zValidator('json', createPostSchema),
    (c) => {
      const data = c.req.valid('json')
      return c.json({ id: crypto.randomUUID(), ...data }, 201)
    }
  )
  // #region get-post-status
  // チェーンの最後の .get('/api/posts/:id', ...) を置き換える
  .get('/api/posts/:id', (c) => {
    const id = c.req.param('id')
    const post = findPost(id)
    if (!post) {
      return c.json({ error: 'Post not found' }, 404)
    }
    return c.json({ post }, 200)
  })
  // #endregion

export type AppType = typeof route

export default app
