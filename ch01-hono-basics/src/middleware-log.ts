// src/index.ts
import { Hono } from 'hono'

const app = new Hono()

// リクエストログを出力するミドルウェア
app.use(async (c, next) => {
  const start = Date.now()
  await next()
  const elapsed = Date.now() - start
  console.log(`${c.req.method} ${c.req.url} - ${elapsed}ms`)
})

app.get('/', (c) => c.text('Hello!'))

export default app
