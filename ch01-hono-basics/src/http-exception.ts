// src/index.ts
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

app.get('/admin', (c) => {
  const token = c.req.header('Authorization')
  if (!token) {
    throw new HTTPException(401, { message: 'Token is required' })
  }
  return c.text('Admin page')
})

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

export default app
