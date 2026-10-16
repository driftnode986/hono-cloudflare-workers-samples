// src/index.ts
import { Hono } from 'hono'
import { authMiddleware } from './middleware/auth'
import type { JwtVariables } from 'hono/jwt'

type Bindings = {
  JWT_SECRET: string
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings; Variables: JwtVariables }>()

// 認証不要のルート
app.get('/posts', async (c) => {
  return c.json({ posts: [] })
})

// 認証が必要なルート
app.use('/admin/*', authMiddleware)

app.get('/admin/profile', (c) => {
  const payload = c.get('jwtPayload')
  return c.json({
    userId: payload.sub,
    role: payload.role,
  })
})

app.post('/admin/posts', async (c) => {
  const payload = c.get('jwtPayload')
  // payload.sub でユーザー ID を取得して記事を作成
  return c.json({ message: 'Post created' }, 201)
})
// src/index.ts
app.use('/admin/*', authMiddleware)
app.delete('/admin/posts/:id', requireRole('admin'), async (c) => {
  // admin ロールのみ削除可能
  return c.body(null, 204)
})
// src/index.ts
// 外部サービスからの Webhook
app.post('/webhook/payment', apiKeyAuth, async (c) => {
  const body = await c.req.json()
  // 決済処理
  return c.json({ received: true })
})
// src/index.ts
import { cors } from 'hono/cors'

// 開発環境: 全オリジンを許可
app.use('/api/*', cors())

// 本番環境: 特定オリジンのみ許可
app.use(
  '/api/*',
  cors({
    origin: 'https://myapp.example.com',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['X-Total-Count'],
    maxAge: 86400,
    credentials: true,
  })
)
// src/index.ts
import { secureHeaders } from 'hono/secure-headers'

app.use(secureHeaders())
// src/index.ts
app.use(
  '/api/*',
  rateLimit({
    windowMs: 60 * 1000, // 1 分
    max: 100,            // 1 分あたり 100 リクエスト
  })
)

// ログイン API はより厳しく
app.use(
  '/auth/login',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分
    max: 5,                    // 15 分あたり 5 回
  })
)
