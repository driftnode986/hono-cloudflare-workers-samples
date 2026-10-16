import { Hono } from 'hono'

const app = new Hono()

// #region custom-headers
// src/index.ts
app.get('/custom', (c) => {
  c.status(200)
  c.header('X-Request-Id', '12345')
  c.header('Cache-Control', 'no-store')
  return c.json({ data: 'custom response' })
})
// #endregion

export default app
