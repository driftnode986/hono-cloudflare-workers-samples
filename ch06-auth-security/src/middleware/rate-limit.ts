// src/middleware/rate-limit.ts
// #region rate-limit-setup
import { createMiddleware } from 'hono/factory'

type Env = {
  Bindings: {
    RATE_KV: KVNamespace
  }
}

type RateLimitOptions = {
  windowMs: number   // ウィンドウ期間 (ミリ秒)
  max: number        // ウィンドウ内の最大リクエスト数
  keyGenerator?: (c: any) => string
}
// #endregion

// #region rate-limit-check
export const rateLimit = (options: RateLimitOptions) => {
  const { windowMs, max, keyGenerator } = options

  return createMiddleware<Env>(async (c, next) => {
    const key = keyGenerator
      ? keyGenerator(c)
      : c.req.header('CF-Connecting-IP') || 'unknown'
    const windowId = Math.floor(Date.now() / windowMs)
    const kvKey = `rate:${key}:${windowId}`

    const current = parseInt((await c.env.RATE_KV.get(kvKey)) || '0')

    if (current >= max) {
      return c.json(
        { error: 'Too many requests' },
        429
      )
    }

// #endregion

// #region rate-limit-count
    c.executionCtx.waitUntil(
      c.env.RATE_KV.put(kvKey, String(current + 1), {
        expirationTtl: Math.ceil(windowMs / 1000) + 60,
      })
    )

    c.header('X-RateLimit-Limit', String(max))
    c.header('X-RateLimit-Remaining', String(max - current - 1))

    await next()
  })
}
// #endregion
