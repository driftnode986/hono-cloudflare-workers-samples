// src/middleware/tenant.ts
import { createMiddleware } from 'hono/factory'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '../db/schema'
import { hashKey } from '../routes/api-keys'
import type { Bindings, Variables } from '../types'

export const tenantAuth = createMiddleware<{
  Bindings: Bindings
  Variables: Variables
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'API key required' }, 401)
  }

  const rawKey = authHeader.slice(7)
  const keyHash = await hashKey(rawKey)
  const db = drizzle(c.env.DB, { schema })

  const [found] = await db
    .select()
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.keyHash, keyHash))
    .limit(1)

  if (!found) {
    return c.json({ error: 'Invalid API key' }, 401)
  }

  await db
    .update(schema.apiKeys)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(schema.apiKeys.id, found.id))

  c.set('tenantId', found.tenantId)

  const [tenant] = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, found.tenantId))
    .limit(1)

  c.set('tenantPlan', tenant?.plan ?? 'free')
  await next()
})
