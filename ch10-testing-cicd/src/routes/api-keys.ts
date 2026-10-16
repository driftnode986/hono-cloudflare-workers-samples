// #region key-helpers
// src/routes/api-keys.ts
import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../db/schema'
import type { Bindings, Variables } from '../types'

async function generateApiKey(): Promise<string> {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `sk_live_${hex}`
}

export async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
// #endregion

// #region issue-key
const apiKeysApp = new Hono<{
  Bindings: Bindings
  Variables: Variables
}>()

apiKeysApp.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const { name } = await c.req.json<{ name: string }>()
  const db = drizzle(c.env.DB, { schema })

  const rawKey = await generateApiKey()
  const keyHash = await hashKey(rawKey)
  const keyPrefix = rawKey.slice(0, 16)
  const id = crypto.randomUUID()

  await db.insert(schema.apiKeys).values({
    id,
    tenantId,
    keyHash,
    keyPrefix,
    name,
  })

  return c.json({ id, key: rawKey, prefix: keyPrefix, name })
})

export default apiKeysApp
// #endregion
