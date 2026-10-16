// src/routes/posts.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, desc, and, count } from 'drizzle-orm'
import { createDb } from '../db'
import { posts, users } from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import type { Bindings } from '../types'

const postsRouter = new Hono<{ Bindings: Bindings }>()

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
})

postsRouter.get('/', zValidator('query', listQuerySchema), async (c) => {
  const { page, limit } = c.req.valid('query')
  const db = createDb(c.env.DB)
  const offset = (page - 1) * limit

  const [items, totalResult] = await Promise.all([
    db.select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      coverImageKey: posts.coverImageKey,
      authorName: users.name,
      status: posts.status,
      createdAt: posts.createdAt
    })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.status, 'published'))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() })
      .from(posts)
      .where(eq(posts.status, 'published'))
  ])

  const total = totalResult[0].total

  return c.json({
    posts: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
})
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(300).optional(),
  slug: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'slug は英小文字・数字・ハイフンのみ'),
  status: z.enum(['draft', 'published']).default('draft')
})

postsRouter.post(
  '/',
  authMiddleware,
  zValidator('json', createPostSchema),
  async (c) => {
    const body = c.req.valid('json')
    const payload = c.get('jwtPayload')
    const authorId = parseInt(payload.sub as string, 10)
    const db = createDb(c.env.DB)

    const existing = await db.query.posts.findFirst({
      where: eq(posts.slug, body.slug)
    })
    if (existing) {
      return c.json({ error: 'Slug already exists' }, 409)
    }

    const result = await db.insert(posts).values({
      ...body,
      authorId
    }).returning()

    return c.json(result[0], 201)
  }
)
const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(300).optional(),
  status: z.enum(['draft', 'published']).optional()
})

postsRouter.put(
  '/:slug',
  authMiddleware,
  zValidator('json', updatePostSchema),
  async (c) => {
    const slug = c.req.param('slug')
    const body = c.req.valid('json')
    const payload = c.get('jwtPayload')
    const authorId = parseInt(payload.sub as string, 10)
    const db = createDb(c.env.DB)

    const existing = await db.query.posts.findFirst({
      where: and(eq(posts.slug, slug), eq(posts.authorId, authorId))
    })
    if (!existing) {
      return c.json({ error: 'Post not found or not authorized' }, 404)
    }

    const result = await db.update(posts)
      .set({
        ...body,
        updatedAt: new Date().toISOString()
      })
      .where(eq(posts.slug, slug))
      .returning()

    return c.json(result[0])
  }
)
postsRouter.delete('/:slug', authMiddleware, async (c) => {
  const slug = c.req.param('slug')
  const payload = c.get('jwtPayload')
  const authorId = parseInt(payload.sub as string, 10)
  const db = createDb(c.env.DB)

  const existing = await db.query.posts.findFirst({
    where: and(eq(posts.slug, slug), eq(posts.authorId, authorId))
  })
  if (!existing) {
    return c.json({ error: 'Post not found or not authorized' }, 404)
  }

  if (existing.coverImageKey) {
    await c.env.IMAGES_BUCKET.delete(existing.coverImageKey)
  }

  await db.delete(posts).where(eq(posts.slug, slug))

  return c.json({ message: 'Post deleted' })
})

export { postsRouter }
// src/routes/posts.ts の /:slug エンドポイントを拡張
import { markdownToHtml } from '../lib/markdown'

postsRouter.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const format = c.req.query('format')
  const db = createDb(c.env.DB)

  const post = await db.select({
    id: posts.id,
    slug: posts.slug,
    title: posts.title,
    content: posts.content,
    excerpt: posts.excerpt,
    coverImageKey: posts.coverImageKey,
    authorName: users.name,
    status: posts.status,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt
  })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.slug, slug))
    .limit(1)

  if (post.length === 0) {
    return c.json({ error: 'Post not found' }, 404)
  }

  const result = post[0]

  if (format === 'html') {
    return c.json({
      ...result,
      contentHtml: markdownToHtml(result.content)
    })
  }

  return c.json(result)
})
