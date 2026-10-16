// src/middleware/timing.ts
import { createMiddleware } from 'hono/factory'

export const timing = createMiddleware(async (c, next) => {
  const start = Date.now()
  await next()
  const elapsed = Date.now() - start
  c.res.headers.set('X-Response-Time', `${elapsed}ms`)
})
