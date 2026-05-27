// src/index.ts — Ch05: R2 Object Storage and KV
import { Hono } from 'hono';

type Bindings = {
  BUCKET: R2Bucket;
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// --- R2: File upload ---
app.post('/files/:key', async (c) => {
  const key = c.req.param('key');
  const contentType = c.req.header('Content-Type') ?? 'application/octet-stream';
  const body = await c.req.arrayBuffer();

  await c.env.BUCKET.put(key, body, {
    httpMetadata: { contentType },
    customMetadata: { uploadedAt: new Date().toISOString() },
  });

  return c.json({ message: 'Uploaded', key, size: body.byteLength }, 201);
});

// --- R2: File download ---
app.get('/files/:key', async (c) => {
  const key = c.req.param('key');
  const object = await c.env.BUCKET.get(key);

  if (!object) {
    return c.json({ error: 'File not found' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);

  return new Response(object.body, { headers });
});

// --- R2: List files ---
app.get('/files', async (c) => {
  const prefix = c.req.query('prefix') ?? '';
  const listed = await c.env.BUCKET.list({ prefix, limit: 100 });

  const files = listed.objects.map((obj) => ({
    key: obj.key,
    size: obj.size,
    uploaded: obj.uploaded.toISOString(),
  }));

  return c.json({ files, truncated: listed.truncated });
});

// --- R2: Delete file ---
app.delete('/files/:key', async (c) => {
  const key = c.req.param('key');
  await c.env.BUCKET.delete(key);
  return c.json({ message: 'Deleted', key });
});

// --- KV: Cache middleware ---
app.get('/cached/:key', async (c) => {
  const key = c.req.param('key');

  // Check cache first
  const cached = await c.env.CACHE.get(key);
  if (cached) {
    return c.json({ data: JSON.parse(cached), source: 'cache' });
  }

  // Simulate expensive computation
  const data = { key, value: `computed-${Date.now()}`, timestamp: new Date().toISOString() };

  // Store in cache with 60s TTL
  await c.env.CACHE.put(key, JSON.stringify(data), { expirationTtl: 60 });

  return c.json({ data, source: 'computed' });
});

// --- KV: Session management ---
app.post('/sessions', async (c) => {
  const sessionId = crypto.randomUUID();
  const body = await c.req.json<{ userId: string }>();

  const session = {
    userId: body.userId,
    createdAt: new Date().toISOString(),
  };

  // Store session with 24h TTL
  await c.env.SESSIONS.put(`session:${sessionId}`, JSON.stringify(session), {
    expirationTtl: 86400,
  });

  return c.json({ sessionId }, 201);
});

app.get('/sessions/:id', async (c) => {
  const id = c.req.param('id');
  const session = await c.env.SESSIONS.get(`session:${id}`);

  if (!session) {
    return c.json({ error: 'Session not found or expired' }, 404);
  }

  return c.json(JSON.parse(session));
});

export default app;
