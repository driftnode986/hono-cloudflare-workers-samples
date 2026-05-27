// src/routes/posts.ts — Blog posts CRUD routes
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { posts } from '../db/schema';
import { authMiddleware } from '../middleware/auth';

type Env = {
  Bindings: { DB: D1Database; IMAGES: R2Bucket; JWT_SECRET: string };
  Variables: { userId: string; userRole: string };
};

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  body: z.string().min(1),
  excerpt: z.string().max(300).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});

const app = new Hono<Env>();

// Public: list published posts
app.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const allPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.status, 'published'))
    .all();
  return c.json({ data: allPosts });
});

// Public: get post by slug
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const db = drizzle(c.env.DB);
  const post = await db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!post) return c.json({ error: 'Post not found' }, 404);
  return c.json(post);
});

// Protected: create post
app.post('/', authMiddleware, zValidator('json', createPostSchema), async (c) => {
  const data = c.req.valid('json');
  const userId = c.get('userId');
  const db = drizzle(c.env.DB);

  const result = await db.insert(posts).values({
    ...data,
    authorId: userId,
    publishedAt: data.status === 'published' ? new Date().toISOString() : null,
  }).returning().get();

  return c.json(result, 201);
});

// Protected: upload cover image
app.post('/:id/cover', authMiddleware, async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.arrayBuffer();
  const contentType = c.req.header('Content-Type') ?? 'image/jpeg';
  const key = `covers/${id}-${Date.now()}`;

  await c.env.IMAGES.put(key, body, {
    httpMetadata: { contentType },
  });

  const db = drizzle(c.env.DB);
  await db.update(posts).set({ coverImageKey: key }).where(eq(posts.id, id));

  return c.json({ message: 'Cover uploaded', key }, 201);
});

export default app;
