// src/middleware/kv-cache.ts
// #region kv-cache-setup
import { createMiddleware } from 'hono/factory'

type Env = {
  Bindings: {
    CACHE_KV: KVNamespace
  }
}
// #endregion

// #region kv-cache
export const kvCache = (ttl: number = 300) =>
  createMiddleware<Env>(async (c, next) => {
    const cacheKey = `cache:${c.req.url}`

    const cached = await c.env.CACHE_KV.get(cacheKey, 'text')
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
        },
      })
    }

    await next()

    if (c.res.ok) {
      const body = await c.res.clone().text()
      c.executionCtx.waitUntil(
        c.env.CACHE_KV.put(cacheKey, body, { expirationTtl: ttl })
      )
      c.res.headers.set('X-Cache', 'MISS')
    }
  })
// #endregion
