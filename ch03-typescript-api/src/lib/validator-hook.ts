// src/lib/validator-hook.ts
import { z } from 'zod'
import type { Context } from 'hono'

export const validationErrorHook = (
  result: { success: boolean; data?: unknown; error?: z.ZodError },
  c: Context
) => {
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    return c.json({ ok: false, errors }, 400)
  }
}
