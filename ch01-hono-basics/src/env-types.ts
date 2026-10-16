// src/index.ts
import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  MY_BUCKET: R2Bucket
  SECRET_KEY: string
}

type Variables = {
  user: { id: string; name: string }
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use(async (c, next) => {
  // c.env.SECRET_KEY は string 型として推論される
  const key = c.env.SECRET_KEY
  // c.set('user', ...) は型チェックされる
  c.set('user', { id: '1', name: 'Alice' })
  await next()
})

app.get('/', (c) => {
  const user = c.get('user')  // { id: string; name: string }
  return c.json({ user })
})

export default app
