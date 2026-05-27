// src/index.ts — Ch01: Hono Basics
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { HTTPException } from 'hono/http-exception';

const app = new Hono();

// --- Middleware ---
app.use('*', logger());
app.use('*', prettyJSON());

// --- Custom middleware ---
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  c.header('X-Response-Time', `${duration}ms`);
});

// --- Basic routing ---
app.get('/', (c) => {
  return c.json({ message: 'Hello Hono!', version: '4.x' });
});

// Route with path parameters
app.get('/users/:id', (c) => {
  const id = c.req.param('id');
  return c.json({ userId: id, name: `User ${id}` });
});

// Route with query parameters
app.get('/search', (c) => {
  const q = c.req.query('q') ?? '';
  const page = Number(c.req.query('page') ?? '1');
  return c.json({ query: q, page, results: [] });
});

// POST with JSON body
app.post('/users', async (c) => {
  const body = await c.req.json<{ name: string; email: string }>();
  return c.json({ id: crypto.randomUUID(), ...body }, 201);
});

// --- Route grouping ---
const api = new Hono();

api.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

api.get('/version', (c) => {
  return c.json({ version: '1.0.0' });
});

app.route('/api', api);

// --- Error handling ---
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error('Unexpected error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

export default app;
