// src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { auth } from './routes/auth'
import { postsRouter } from './routes/posts'
import { images } from './routes/images'
import type { Bindings } from './types'

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', secureHeaders())
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'https://your-blog.example.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

app.get('/', (c) => c.json({ message: 'Blog API is running' }))

app.route('/api/auth', auth)
app.route('/api/posts', postsRouter)
app.route('/api/images', images)

app.onError((err, c) => {
  console.error(`Error: ${err.message}`)
  return c.json(
    { error: 'Internal Server Error', message: err.message },
    500
  )
})

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

export default app
