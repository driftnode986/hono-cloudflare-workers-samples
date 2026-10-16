// src/types.ts
type Bindings = {
  DB: D1Database
  FILES_BUCKET: R2Bucket
  CACHE_KV: KVNamespace
  SESSION_KV: KVNamespace
}

type Variables = {
  session: SessionData | null
  sessionId: string | null
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}
