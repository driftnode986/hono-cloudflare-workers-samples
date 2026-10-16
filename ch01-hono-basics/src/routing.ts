// src/index.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('GET /'))
app.post('/posts', (c) => c.text('POST /posts'))
app.put('/posts/:id', (c) => c.text('PUT /posts/:id'))
app.delete('/posts/:id', (c) => c.text('DELETE /posts/:id'))

// 全 HTTP メソッドにマッチ
app.all('/health', (c) => c.text('OK'))

export default app
