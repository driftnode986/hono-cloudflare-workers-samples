// src/steps/rate-limit-by-user.ts (6.7 のカスタムキー。IP ではなくユーザー ID で数える)
import { Hono } from 'hono'
import type { JwtVariables } from 'hono/jwt'
import { authMiddleware } from '../middleware/auth'
import { rateLimit } from '../middleware/rate-limit'

type Bindings = {
  JWT_SECRET: string
  RATE_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings; Variables: JwtVariables }>()

// #region by-user
app.use(
  '/api/*',
  authMiddleware,
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    keyGenerator: (c) => c.get('jwtPayload')?.sub || 'anonymous',
  })
)
// #endregion

app.get('/api/ping', (c) => c.json({ pong: true }))

export default app
