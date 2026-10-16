// src/index.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

const createPostSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1),
  tags: z.array(z.string()).max(5).optional(),
})

app.post(
  '/api/posts',
  zValidator('json', createPostSchema),
  (c) => {
    const data = c.req.valid('json')
    // data.title は string, data.tags は string[] | undefined と推論される
    return c.json({ id: crypto.randomUUID(), ...data }, 201)
  }
)

export default app
