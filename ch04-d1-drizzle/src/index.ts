// src/index.ts — Ch04: D1 Database with Drizzle ORM
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

// --- Schema definition ---
export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  slug: text('slug').notNull().unique(),
  publishedAt: text('published_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// --- Zod schemas ---
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});

const updatePostSchema = createPostSchema.partial();

// --- Bindings ---
type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// --- CRUD routes ---

// List posts
app.get('/posts', async (c) => {
  const db = drizzle(c.env.DB);
  const allPosts = await db.select().from(posts).all();
  return c.json({ data: allPosts, total: allPosts.length });
});

// Get single post
app.get('/posts/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = drizzle(c.env.DB);
  const post = await db.select().from(posts).where(eq(posts.id, id)).get();
  if (!post) {
    return c.json({ error: 'Post not found' }, 404);
  }
  return c.json(post);
});

// Create post
app.post('/posts', zValidator('json', createPostSchema), async (c) => {
  const data = c.req.valid('json');
  const db = drizzle(c.env.DB);
  const result = await db.insert(posts).values(data).returning().get();
  return c.json(result, 201);
});

// Update post
app.put('/posts/:id', zValidator('json', updatePostSchema), async (c) => {
  const id = Number(c.req.param('id'));
  const data = c.req.valid('json');
  const db = drizzle(c.env.DB);
  const result = await db
    .update(posts)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(posts.id, id))
    .returning()
    .get();
  if (!result) {
    return c.json({ error: 'Post not found' }, 404);
  }
  return c.json(result);
});

// Delete post
app.delete('/posts/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = drizzle(c.env.DB);
  const result = await db.delete(posts).where(eq(posts.id, id)).returning().get();
  if (!result) {
    return c.json({ error: 'Post not found' }, 404);
  }
  return c.json({ message: 'Deleted', id });
});

export default app;
