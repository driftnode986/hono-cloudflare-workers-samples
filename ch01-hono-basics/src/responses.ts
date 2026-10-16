// src/index.ts
import { Hono } from 'hono'

const app = new Hono()

// テキストレスポンス
app.get('/text', (c) => c.text('Hello!'))

// JSON レスポンス
app.get('/json', (c) => c.json({ message: 'Hello!' }))

// JSON レスポンス (ステータス付き)
app.post('/api/posts', (c) => c.json({ created: true }, 201))

// HTML レスポンス
app.get('/html', (c) => c.html('<h1>Hello!</h1>'))

// リダイレクト
app.get('/old-page', (c) => c.redirect('/new-page'))        // 302
app.get('/moved', (c) => c.redirect('/new-location', 301))  // 301

export default app
