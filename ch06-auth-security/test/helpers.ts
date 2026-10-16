// test/helpers.ts
import { env } from 'cloudflare:workers'
import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { sign } from 'hono/jwt'

type Requester = {
  // メソッド形式で書くと引数が双変になり、Bindings の型が違う Hono でも渡せる
  request(
    input: string,
    init?: RequestInit,
    env?: unknown,
    ctx?: ExecutionContext
  ): Response | Promise<Response>
}

// waitUntil で書かれる KV のカウンタまで待ってからレスポンスを返す
export const call = async (
  app: Requester,
  path: string,
  init?: RequestInit,
  bindings: unknown = env
) => {
  const ctx = createExecutionContext()
  const res = await app.request(path, init, bindings, ctx)
  await waitOnExecutionContext(ctx)
  return res
}

export const tokenFor = (sub: string, role: string, ttl = 3600) => {
  const now = Math.floor(Date.now() / 1000)
  return sign({ sub, role, iat: now, exp: now + ttl }, env.JWT_SECRET)
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })
