// src/index.ts
import { Hono } from 'hono'

type Bindings = {
  // [vars] で定義した環境変数
  API_HOST: string
  // wrangler secret put で定義したシークレット
  JWT_SECRET: string
  // D1 バインディング
  DB: D1Database
  // R2 バインディング
  BUCKET: R2Bucket
  // KV バインディング
  CACHE: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  const host = c.env.API_HOST   // string 型で補完が効く
  return c.json({ host })
})

export default app
