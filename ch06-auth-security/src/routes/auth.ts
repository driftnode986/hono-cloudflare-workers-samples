// src/routes/auth.ts
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

type Bindings = {
  JWT_SECRET: string
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

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

export default app
