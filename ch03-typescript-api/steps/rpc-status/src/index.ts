import { Hono } from 'hono'

// #region get-post-status
// src/index.ts (前節の GET /api/posts/:id を置き換える)
import { findPost } from './lib/find-post'

const app = new Hono()

const route = app.get('/api/posts/:id', (c) => {
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
