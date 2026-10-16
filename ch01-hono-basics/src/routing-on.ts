import { Hono } from 'hono'

const app = new Hono()

// #region on-method
// src/index.ts
app.on(['PUT', 'DELETE'], '/posts/:id', (c) => {
  return c.text(`${c.req.method} /posts/${c.req.param('id')}`)
})
// #endregion

export default app
