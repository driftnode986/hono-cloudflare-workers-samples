// src/routes/resources.ts
import { Hono } from 'hono'
import { eq, and, desc } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../db/schema'
import type { Bindings, Variables } from '../types'

const resourcesApp = new Hono<{
  Bindings: Bindings
  Variables: Variables
}>()

resourcesApp.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const db = drizzle(c.env.DB, { schema })

  const items = await db
    .select()
    .from(schema.resources)
    .where(eq(schema.resources.tenantId, tenantId))
    .orderBy(desc(schema.resources.createdAt))
    .limit(50)

  return c.json({ resources: items })
})

resourcesApp.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const { title, content } = await c.req.json<{
    title: string
    content?: string
  }>()
  const db = drizzle(c.env.DB, { schema })

  const id = crypto.randomUUID()
  await db.insert(schema.resources).values({
    id,
    tenantId,
    title,
    content: content ?? null,
  })

  return c.json({ id, title }, 201)
})

resourcesApp.delete('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const resourceId = c.req.param('id')
  const db = drizzle(c.env.DB, { schema })

  const result = await db
    .delete(schema.resources)
    .where(
      and(
        eq(schema.resources.id, resourceId),
        eq(schema.resources.tenantId, tenantId)
      )
    )

  if (result.meta.changes === 0) {
    return c.json({ error: 'Resource not found' }, 404)
  }

  return c.json({ deleted: true })
})

export default resourcesApp
