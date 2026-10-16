import { Hono } from 'hono'

const app = new Hono()

// #region api-auth
// src/index.ts
// /api/* 配下のルートにだけ適用
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})
// #endregion

app.get('/', (c) => c.text('Public'))
app.get('/api/data', (c) => c.json({ items: [] }))

export default app
