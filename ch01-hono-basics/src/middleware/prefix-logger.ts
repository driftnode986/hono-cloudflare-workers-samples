// src/middleware/prefix-logger.ts
import { createMiddleware } from 'hono/factory'

export const prefixLogger = (prefix: string) => {
  return createMiddleware(async (c, next) => {
    console.log(`[${prefix}] ${c.req.method} ${c.req.url}`)
    await next()
  })
}
