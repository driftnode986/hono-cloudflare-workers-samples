// src/index.ts
// #region app-setup
import { Hono } from 'hono'
import { authMiddleware } from './middleware/auth'
import type { JwtVariables } from 'hono/jwt'

type Bindings = {
  JWT_SECRET: string
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings; Variables: JwtVariables }>()
// #endregion

// #region secure-headers
import { secureHeaders } from 'hono/secure-headers'

// ルートより前に登録する。後ろに書くと、それ以前のルートには付かない
app.use(secureHeaders())
// #endregion

// #region public-routes
// 認証不要のルート
app.get('/posts', async (c) => {
  return c.json({ posts: [] })
})

// 認証が必要なルート
app.use('/admin/*', authMiddleware)
// #endregion

// #region admin-routes
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
// #endregion

// #region admin-delete
import { requireRole } from './middleware/auth'

app.delete('/admin/posts/:id', requireRole('admin'), async (c) => {
  // admin ロールのみ削除可能
  return c.body(null, 204)
})
// #endregion

// #region webhook
import { apiKeyAuth } from './middleware/api-key'

// 外部サービスからの Webhook
app.post('/webhook/payment', apiKeyAuth, async (c) => {
  const body = await c.req.json()
  // 決済処理
  return c.json({ received: true })
})
// #endregion

// #region cors
import { cors } from 'hono/cors'

// 開発環境: 全オリジンを許可 (本番では使わない。どちらか一方だけを登録する)
// app.use('/api/*', cors())

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
// #endregion

// #region rate-limit-usage
import { rateLimit } from './middleware/rate-limit'

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
// #endregion

// #region mount-auth
import authRoutes from './routes/auth'

app.route('/', authRoutes)
// #endregion

// #region api-ping
// CORS・セキュリティヘッダー・レート制限の動作確認用 (/api/* の例)
app.get('/api/ping', (c) => c.json({ pong: true }))
// #endregion

// #region export
export default app
// #endregion
