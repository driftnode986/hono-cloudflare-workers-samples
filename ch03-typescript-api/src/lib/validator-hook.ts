// src/lib/validator-hook.ts
import { z } from 'zod'
import type { Context } from 'hono'

export const validationErrorHook = (
  result:
    | { success: true; data: unknown }
    | { success: false; error: z.core.$ZodError },
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
