// src/routes/auth.ts
// #region login
import { Hono } from 'hono'
import type { AppEnv } from '../types'
import {
  createSession,
  destroySession,
  sessionMiddleware,
} from '../middleware/session'

const app = new Hono<AppEnv>()

app.post('/login', async (c) => {
  // 認証処理 (省略)
  const user = { userId: 'user-1', role: 'admin' }

  const sessionId = await createSession(c.env.SESSION_KV, {
    ...user,
    createdAt: new Date().toISOString(),
  })

  return c.json({ sessionId })
})
// #endregion

// #region logout
app.post('/logout', sessionMiddleware, async (c) => {
  const sessionId = c.get('sessionId')
  if (sessionId) {
    await destroySession(c.env.SESSION_KV, sessionId)
  }
  return c.body(null, 204)
})

export default app
// #endregion
