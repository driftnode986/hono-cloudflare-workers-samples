// src/routes/me.ts
import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { authMiddleware } from '../middleware/auth'

const app = new Hono<AppEnv>()

app.use(authMiddleware)

app.get('/api/me', (c) => {
  const user = c.get('user')
  // user: { id: string; email: string } | null
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  return c.json({ user })
})

export default app
