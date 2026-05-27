// src/routes/tenants.ts — Tenant management routes
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { tenants, apiKeys } from '../db/schema';

type Env = {
  Bindings: { DB: D1Database; JWT_SECRET: string };
};

const createTenantSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  plan: z.enum(['free', 'pro', 'enterprise']).default('free'),
});

const app = new Hono<Env>();

// Create tenant
app.post('/', zValidator('json', createTenantSchema), async (c) => {
  const data = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const tenant = await db.insert(tenants).values(data).returning().get();

  // Generate initial API key
  const key = `sk_${crypto.randomUUID().replace(/-/g, '')}`;
  const apiKey = await db
    .insert(apiKeys)
    .values({ tenantId: tenant.id, key, name: 'Default Key', scopes: 'read,write' })
    .returning()
    .get();

  return c.json({ tenant, apiKey: { id: apiKey.id, key: apiKey.key } }, 201);
});

// Get tenant by slug
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const db = drizzle(c.env.DB);
  const tenant = await db.select().from(tenants).where(eq(tenants.slug, slug)).get();

  if (!tenant) return c.json({ error: 'Tenant not found' }, 404);
  return c.json(tenant);
});

export default app;
