import { Hono } from 'hono'

const app = new Hono()

// #region json-body
// src/index.ts
app.post('/api/posts', async (c) => {
  const body = await c.req.json<{ title: string; content: string }>()
  return c.json({ received: body }, 201)
})
// #endregion

export default app
