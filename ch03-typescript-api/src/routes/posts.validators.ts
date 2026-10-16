import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

const createPostSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1),
  tags: z.array(z.string()).max(5).optional(),
})

// #region list-query
// src/routes/posts.ts
const listPostsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tag: z.string().optional(),
})

app.get(
  '/api/posts',
  zValidator('query', listPostsQuery),
  (c) => {
    const { page, limit, tag } = c.req.valid('query')
    // page: number, limit: number, tag: string | undefined
    return c.json({ page, limit, tag, items: [] })
  }
)
// #endregion

// #region param
// src/routes/posts.ts
const postIdParam = z.object({
  id: z.string().uuid(),
})

app.get(
  '/api/posts/:id',
  zValidator('param', postIdParam),
  (c) => {
    const { id } = c.req.valid('param')
    // id: string (UUID 形式であることが保証される)
    return c.json({ id, title: 'Sample', body: 'Hello' })
  }
)
// #endregion

// #region hook
// src/routes/posts.ts
import { validationErrorHook } from '../lib/validator-hook'

app.post(
  '/api/posts',
  zValidator('json', createPostSchema, validationErrorHook),
  (c) => {
    const data = c.req.valid('json')
    return c.json({ ok: true, id: crypto.randomUUID(), ...data }, 201)
  }
)
// #endregion

// #region update
// src/routes/posts.ts
const updatePostSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  body: z.string().min(1).optional(),
  tags: z.array(z.string()).max(5).optional(),
})

app.put(
  '/api/posts/:id',
  zValidator('param', postIdParam),
  zValidator('json', updatePostSchema),
  (c) => {
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')
    return c.json({ id, ...data })
  }
)
// #endregion

export default app
