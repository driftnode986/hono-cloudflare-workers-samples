// src/middleware/multi-api-key.ts
// #region multi-api-key
import { bearerAuth } from 'hono/bearer-auth'
import { createMiddleware } from 'hono/factory'

type Env = {
  Bindings: {
    API_KEYS: string
  }
}

export const multiApiKeyAuth = createMiddleware<Env>(async (c, next) => {
  const middleware = bearerAuth<Env>({
    verifyToken: async (token, ctx) => {
      // カンマ区切りで複数キーを環境変数に設定
      const validKeys = ctx.env.API_KEYS.split(',')
      return validKeys.includes(token)
    },
  })
  return middleware(c, next)
})
// #endregion
