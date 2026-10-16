// #region rpc-schema
// src/index.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

const createPostSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1),
})
// #endregion

// #region rpc-route
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
  .get('/api/posts/:id', (c) => {
    const id = c.req.param('id')
    return c.json({ id, title: 'Hello', body: 'World' })
  })

export type AppType = typeof route

export default app
// #endregion
