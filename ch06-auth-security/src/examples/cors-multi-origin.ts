// src/examples/cors-multi-origin.ts (6.5 の複数オリジンの例)
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// #region multi-origin
app.use(
  '/api/*',
  cors({
    origin: ['https://app.example.com', 'https://admin.example.com'],
  })
)
// #endregion

app.get('/api/ping', (c) => c.json({ pong: true }))

export default app
