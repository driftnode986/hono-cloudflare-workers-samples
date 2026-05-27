// src/index.ts — Ch10: Testing and CI/CD
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { eq } from 'drizzle-orm';

// --- Schema ---
export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// --- Bindings ---
type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Health check
app.get('/', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// List items
app.get('/items', async (c) => {
  const db = drizzle(c.env.DB);
  const allItems = await db.select().from(items).all();
  return c.json({ data: allItems });
});

// Get item by ID
app.get('/items/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = drizzle(c.env.DB);
  const item = await db.select().from(items).where(eq(items.id, id)).get();

  if (!item) {
    return c.json({ error: 'Item not found' }, 404);
  }
  return c.json(item);
});

// Create item
app.post('/items', async (c) => {
  const body = await c.req.json<{ name: string; description?: string }>();

  if (!body.name) {
    return c.json({ error: 'Name is required' }, 400);
  }

  const db = drizzle(c.env.DB);
  const result = await db.insert(items).values(body).returning().get();
  return c.json(result, 201);
});

// Delete item
app.delete('/items/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = drizzle(c.env.DB);
  const result = await db.delete(items).where(eq(items.id, id)).returning().get();

  if (!result) {
    return c.json({ error: 'Item not found' }, 404);
  }
  return c.json({ message: 'Deleted', id });
});

export default app;
