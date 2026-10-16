// src/middleware/auth.ts
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types'

type AuthUser = {
  id: string
  email: string
}

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // トークン検証ロジック (Ch6 で詳述)
  const user: AuthUser = { id: '1', email: 'user@example.com' }
  c.set('user', user)
  await next()
})
