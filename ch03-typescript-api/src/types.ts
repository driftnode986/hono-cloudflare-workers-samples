// src/types.ts
export type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
  CACHE: KVNamespace
  AI: Ai
  JWT_SECRET: string
}

export type Variables = {
  requestId: string
  user: { id: string; email: string } | null
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}
