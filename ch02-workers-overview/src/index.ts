// src/index.ts — Ch02: Cloudflare Workers Overview
import { Hono } from 'hono';

// Type definitions for Cloudflare bindings
type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// --- Workers Runtime basics ---
app.get('/', (c) => {
  return c.json({
    message: 'Cloudflare Workers with Hono',
    runtime: 'workerd',
    bindings: ['D1', 'R2', 'KV'],
  });
});

// --- Environment info ---
app.get('/info', (c) => {
  return c.json({
    url: c.req.url,
    method: c.req.method,
    headers: Object.fromEntries(c.req.raw.headers),
    cf: c.req.raw.cf ?? {},
  });
});

// --- D1 binding check ---
app.get('/d1/check', async (c) => {
  const db = c.env.DB;
  const result = await db.prepare('SELECT 1 as value').first<{ value: number }>();
  return c.json({ d1: 'connected', result });
});

// --- R2 binding check ---
app.get('/r2/check', async (c) => {
  const bucket = c.env.BUCKET;
  const listed = await bucket.list({ limit: 5 });
  return c.json({
    r2: 'connected',
    objectCount: listed.objects.length,
    truncated: listed.truncated,
  });
});

// --- KV binding check ---
app.get('/kv/check', async (c) => {
  const kv = c.env.KV;
  await kv.put('test-key', 'hello from KV');
  const value = await kv.get('test-key');
  return c.json({ kv: 'connected', value });
});

// --- Scheduled event handler ---
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        console.log(`Cron triggered: ${event.cron} at ${new Date(event.scheduledTime).toISOString()}`);
        await env.KV.put('last-cron', new Date().toISOString());
      })()
    );
  },
};
