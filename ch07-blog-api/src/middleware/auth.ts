// src/middleware/auth.ts
import { jwt } from 'hono/jwt'
import { createMiddleware } from 'hono/factory'
import type { Bindings } from '../types'

export const authMiddleware = createMiddleware<{
  Bindings: Bindings
}>(async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' })
  await jwtMiddleware(c, next)
})
