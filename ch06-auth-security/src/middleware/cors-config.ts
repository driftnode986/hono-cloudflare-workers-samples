// src/middleware/cors-config.ts
// #region cors-config
import { cors } from 'hono/cors'
import { createMiddleware } from 'hono/factory'

type Env = {
  Bindings: {
    ENVIRONMENT: string
    ALLOWED_ORIGIN: string
  }
}

export const corsConfig = createMiddleware<Env>(async (c, next) => {
  const middleware = cors({
    origin: (origin) => {
      if (c.env.ENVIRONMENT === 'development') {
        return origin // 開発環境では全オリジン許可
      }
      if (origin === c.env.ALLOWED_ORIGIN) {
        return origin
      }
      return '' // 不許可
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
  return middleware(c, next)
})
// #endregion
