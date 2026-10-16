// src/middleware/auth.ts
import { jwt } from 'hono/jwt'
import { createMiddleware } from 'hono/factory'
import type { JwtVariables } from 'hono/jwt'

type Env = {
  Bindings: {
    JWT_SECRET: string
  }
  Variables: JwtVariables
}

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
    alg: 'HS256',
  })
  return jwtMiddleware(c, next)
})
// src/middleware/auth.ts
export const requireRole = (...roles: string[]) =>
  createMiddleware<Env>(async (c, next) => {
    const payload = c.get('jwtPayload')

    if (!payload || !roles.includes(payload.role)) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    await next()
  })
