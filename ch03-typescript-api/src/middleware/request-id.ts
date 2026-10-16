// src/middleware/request-id.ts
import { createMiddleware } from 'hono/factory'

export const requestId = createMiddleware<{
  Variables: { requestId: string }
}>(async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  await next()
})
