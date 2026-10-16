import { Hono } from 'hono'
import { findPost } from '../../../src/lib/find-post'

const app = new Hono()

// #region get-post-status
// src/routes/posts.ts (サーバー側)
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
