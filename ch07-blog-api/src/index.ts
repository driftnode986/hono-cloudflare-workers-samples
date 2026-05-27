// src/index.ts — Ch07: Blog API (Full Project)
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';

type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// --- Global middleware ---
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// --- Health check ---
app.get('/', (c) => {
  return c.json({
    name: 'Blog API',
    version: '1.0.0',
    endpoints: ['/auth/register', '/auth/login', '/posts'],
  });
});

// --- Mount routes ---
app.route('/auth', authRoutes);
app.route('/posts', postRoutes);

// --- Image serving from R2 ---
app.get('/images/:key{.+}', async (c) => {
  const key = c.req.param('key');
  const object = await c.env.IMAGES.get(key);

  if (!object) {
    return c.json({ error: 'Image not found' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=86400');

  return new Response(object.body, { headers });
});

// --- Error handling ---
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

export default app;
