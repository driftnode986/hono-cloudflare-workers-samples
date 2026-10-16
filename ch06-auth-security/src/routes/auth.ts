// src/routes/auth.ts
// #region login-setup
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { verifyPassword } from '../lib/password'
import { findUserByEmail } from '../lib/users'

type Bindings = {
  JWT_SECRET: string
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
// #endregion

// #region login-handler
app.post('/auth/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  // データベースでユーザーを検索 (ハッシュ照合の詳細は後述)
  const user = await findUserByEmail(c.env.DB, email)

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    sub: user.id,
    role: user.role,
    iat: now,
    exp: now + 3600, // 1 時間後に失効
  }

  const token = await sign(payload, c.env.JWT_SECRET)

  return c.json({ token, expiresIn: 3600 })
})
// #endregion

// #region register
import { hashPassword } from '../lib/password'

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
})

app.post('/auth/register', zValidator('json', registerSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  if (await findUserByEmail(c.env.DB, email)) {
    return c.json({ error: 'Email already registered' }, 409)
  }

  // role はクライアントから受け取らず、常に user にする
  const id = crypto.randomUUID()
  await c.env.DB
    .prepare(
      'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)'
    )
    .bind(id, email, await hashPassword(password), 'user')
    .run()

  return c.json({ id }, 201)
})
// #endregion

// #region login-export
export default app
// #endregion
