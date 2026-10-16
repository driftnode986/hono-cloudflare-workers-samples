// src/index.ts
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

const app = new Hono()

app.use(logger())
app.use(secureHeaders())
app.use('/api/*', cors({
  origin: 'https://example.com',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

app.get('/', (c) => c.text('Hello!'))
app.get('/api/data', (c) => c.json({ items: [] }))

export default app
