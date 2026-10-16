// src/middleware/api-key.ts
import { bearerAuth } from 'hono/bearer-auth'
import { createMiddleware } from 'hono/factory'

type Env = {
  Bindings: {
    API_KEY: string
  }
}

export const apiKeyAuth = createMiddleware<Env>(async (c, next) => {
  const middleware = bearerAuth({
    verifyToken: async (token, ctx) => {
      return token === ctx.env.API_KEY
    },
  })
  return middleware(c, next)
})
