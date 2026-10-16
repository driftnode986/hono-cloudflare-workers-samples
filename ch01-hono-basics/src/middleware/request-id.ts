// src/middleware/request-id.ts
import { factory } from '../factory'

export const requestIdMiddleware = factory.createMiddleware(async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  await next()
})
