// src/examples/login-schema.ts (6.8 の入力バリデーション。長さの上限を足した版)
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

// #region login-schema
const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
})
// #endregion

const app = new Hono()

app.post('/auth/login', zValidator('json', loginSchema), (c) => {
  return c.json(c.req.valid('json'))
})

export default app
