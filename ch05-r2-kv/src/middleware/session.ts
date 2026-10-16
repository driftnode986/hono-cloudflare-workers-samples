// src/middleware/session.ts
import { createMiddleware } from 'hono/factory'

type SessionData = {
  userId: string
  role: string
  createdAt: string
}

type Env = {
  Bindings: {
    SESSION_KV: KVNamespace
  }
  Variables: {
    session: SessionData | null
    sessionId: string | null
  }
}

export const sessionMiddleware = createMiddleware<Env>(async (c, next) => {
  const sessionId = c.req.header('X-Session-Id')

  if (sessionId) {
    const data = await c.env.SESSION_KV.get<SessionData>(
      `session:${sessionId}`,
      'json'
    )
    c.set('session', data)
    c.set('sessionId', sessionId)
  } else {
    c.set('session', null)
    c.set('sessionId', null)
  }

  await next()
})

export const createSession = async (
  kv: KVNamespace,
  data: SessionData
): Promise<string> => {
  const sessionId = crypto.randomUUID()
  await kv.put(`session:${sessionId}`, JSON.stringify(data), {
    expirationTtl: 86400, // 24 時間
  })
  return sessionId
}

export const destroySession = async (
  kv: KVNamespace,
  sessionId: string
): Promise<void> => {
  await kv.delete(`session:${sessionId}`)
}
