// src/middleware/api-key.ts — API key authentication middleware
import { createMiddleware } from 'hono/factory';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { apiKeys } from '../db/schema';

type Env = {
  Bindings: { DB: D1Database };
  Variables: { tenantId: string; apiKeyScopes: string };
};

export const apiKeyAuth = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing API key' }, 401);
  }

  const key = authHeader.slice(7);
  const db = drizzle(c.env.DB);
  const apiKey = await db.select().from(apiKeys).where(eq(apiKeys.key, key)).get();

  if (!apiKey) {
    return c.json({ error: 'Invalid API key' }, 401);
  }

  // Update last used timestamp
  await db.update(apiKeys).set({ lastUsedAt: new Date().toISOString() }).where(eq(apiKeys.id, apiKey.id));

  c.set('tenantId', apiKey.tenantId);
  c.set('apiKeyScopes', apiKey.scopes);
  await next();
});
