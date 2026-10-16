// #region plan-limits
// src/middleware/quota.ts
import { createMiddleware } from 'hono/factory'
import type { Bindings, Variables } from '../types'

const PLAN_LIMITS: Record<
  string,
  { dailyRequests: number; maxKeys: number }
> = {
  free: { dailyRequests: 100, maxKeys: 1 },
  pro: { dailyRequests: 10_000, maxKeys: 5 },
  enterprise: { dailyRequests: 100_000, maxKeys: 50 },
}
// #endregion

// #region quota-check
export const quotaCheck = createMiddleware<{
  Bindings: Bindings
  Variables: Variables
}>(async (c, next) => {
  const tenantId = c.get('tenantId')
  const plan = c.get('tenantPlan')
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free

  const today = new Date().toISOString().slice(0, 10)
  const counterKey = `usage:${tenantId}:${today}`

  const current = await c.env.PLAN_KV.get(counterKey)
  const count = current ? parseInt(current, 10) : 0

  if (count >= limits.dailyRequests) {
    return c.json(
      { error: 'Daily quota exceeded', limit: limits.dailyRequests },
      429
    )
  }

  await c.env.PLAN_KV.put(counterKey, String(count + 1), {
    expirationTtl: 86400,
  })

  await next()
})
// #endregion
