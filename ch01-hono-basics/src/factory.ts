// src/factory.ts
import { createFactory } from 'hono/factory'

type Env = {
  Bindings: {
    DB: D1Database
    KV: KVNamespace
  }
  Variables: {
    requestId: string
  }
}

export const factory = createFactory<Env>()
