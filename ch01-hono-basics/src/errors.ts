// src/index.ts
import { Hono } from 'hono'

const app = new Hono()

app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.url }, 404)
})

app.onError((err, c) => {
  console.error(`Unhandled error: ${err.message}`)
  return c.json({ error: 'Internal Server Error' }, 500)
})

app.get('/', (c) => c.text('Hello!'))

export default app
