// #region auth-setup
// src/routes/auth.ts
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { createDb } from '../db'
import { users } from '../db/schema'
import type { Bindings } from '../types'

const auth = new Hono<{ Bindings: Bindings }>()

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100)
})
// #endregion

// #region register
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, name } = c.req.valid('json')
  const db = createDb(c.env.DB)

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email)
  })
  if (existing) {
    return c.json({ error: 'Email already registered' }, 409)
  }

  const passwordHash = await hashPassword(password)
  const result = await db.insert(users).values({
    email,
    passwordHash,
    name
  }).returning()

  const token = await sign(
    { sub: result[0].id.toString(), role: 'author' },
    c.env.JWT_SECRET
  )

  return c.json({ token, user: { id: result[0].id, email, name } }, 201)
})
// #endregion

// #region login-check
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  const db = createDb(c.env.DB)

  const user = await db.query.users.findFirst({
    where: eq(users.email, email)
  })
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const passwordHash = await hashPassword(password)
  if (user.passwordHash !== passwordHash) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }
// #endregion

// #region login-token
  const token = await sign(
    { sub: user.id.toString(), role: 'author' },
    c.env.JWT_SECRET
  )

  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name }
  })
})

export { auth }
// #endregion
