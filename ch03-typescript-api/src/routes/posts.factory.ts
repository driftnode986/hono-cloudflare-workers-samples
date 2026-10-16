// src/routes/posts.ts
import { factory } from '../factory'

const app = factory.createApp()

app.get('/api/posts', (c) => {
  const db = c.env.DB   // D1Database と推論される
  return c.json({ items: [] })
})

export default app
