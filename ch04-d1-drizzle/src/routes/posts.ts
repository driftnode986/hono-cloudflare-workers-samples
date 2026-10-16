// #region list-setup
// src/routes/posts.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, desc, like, sql } from 'drizzle-orm'
import type { AppEnv } from '../types'
import { createDb } from '../db'
import { posts } from '../db/schema'

const app = new Hono<AppEnv>()
// #endregion

// #region list-route
// 一覧取得 (ページネーション付き)
app.get(
  '/',
  zValidator('query', z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
  })),
  async (c) => {
    const db = createDb(c.env.DB)
    const { page, limit, search } = c.req.valid('query')
    const offset = (page - 1) * limit

    const conditions = search
      ? like(posts.title, `%${search}%`)
      : undefined
// #endregion

// #region list-query
    const items = await db
      .select()
      .from(posts)
      .where(conditions)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset)

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(conditions)

    const total = totalResult[0].count

    return c.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  }
)
// #endregion

// #region get-one
// src/routes/posts.ts
app.get(
  '/:id',
  zValidator('param', z.object({ id: z.string().uuid() })),
  async (c) => {
    const db = createDb(c.env.DB)
    const { id } = c.req.valid('param')

    const results = await db
      .select()
      .from(posts)
      .where(eq(posts.id, id))
      .limit(1)

    if (results.length === 0) {
      return c.json({ error: 'Post not found' }, 404)
    }

    return c.json({ post: results[0] })
  }
)
// #endregion

// #region create
// src/routes/posts.ts
const createPostSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
})

app.post(
  '/',
  zValidator('json', createPostSchema),
  async (c) => {
    const db = createDb(c.env.DB)
    const data = c.req.valid('json')

    const results = await db
      .insert(posts)
      .values({
        title: data.title,
        body: data.body,
        slug: data.slug,
      })
      .returning()

    return c.json({ post: results[0] }, 201)
  }
)
// #endregion

// #region update-schema
// src/routes/posts.ts
const updatePostSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  body: z.string().min(1).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  publishedAt: z.string().datetime().nullable().optional(),
})
// #endregion

// #region update-route
app.put(
  '/:id',
  zValidator('param', z.object({ id: z.string().uuid() })),
  zValidator('json', updatePostSchema),
  async (c) => {
    const db = createDb(c.env.DB)
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')

    const results = await db
      .update(posts)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(posts.id, id))
      .returning()

    if (results.length === 0) {
      return c.json({ error: 'Post not found' }, 404)
    }

    return c.json({ post: results[0] })
  }
)
// #endregion

// #region delete
// src/routes/posts.ts
app.delete(
  '/:id',
  zValidator('param', z.object({ id: z.string().uuid() })),
  async (c) => {
    const db = createDb(c.env.DB)
    const { id } = c.req.valid('param')

    const results = await db
      .delete(posts)
      .where(eq(posts.id, id))
      .returning()

    if (results.length === 0) {
      return c.json({ error: 'Post not found' }, 404)
    }

    return c.json({ message: 'Deleted' })
  }
)
// #endregion

// #region add-tags
// src/routes/posts.ts
import { tags, postTags } from '../db/schema'

// 記事にタグを付与
app.post(
  '/:id/tags',
  zValidator('param', z.object({ id: z.string().uuid() })),
  zValidator('json', z.object({ tagIds: z.array(z.number().int()) })),
  async (c) => {
    const db = createDb(c.env.DB)
    const { id } = c.req.valid('param')
    const { tagIds } = c.req.valid('json')

    const values = tagIds.map((tagId) => ({
      postId: id,
      tagId,
    }))

    await db.insert(postTags).values(values).onConflictDoNothing()

    return c.json({ message: 'Tags added' })
  }
)
// #endregion

// #region detail
// src/routes/posts.ts
app.get(
  '/:id/detail',
  zValidator('param', z.object({ id: z.string().uuid() })),
  async (c) => {
    const db = createDb(c.env.DB)
    const { id } = c.req.valid('param')

    const results = await db
      .select({
        post: posts,
        tagName: tags.name,
      })
      .from(posts)
      .leftJoin(postTags, eq(posts.id, postTags.postId))
      .leftJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(posts.id, id))

    if (results.length === 0) {
      return c.json({ error: 'Post not found' }, 404)
    }

    const post = results[0].post
    const tagNames = results
      .map((r) => r.tagName)
      .filter((name): name is string => name !== null)

    return c.json({ ...post, tags: tagNames })
  }
)
// #endregion

// #region with-tags
// src/routes/posts.ts
app.post(
  '/with-tags',
  zValidator('json', z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    tagNames: z.array(z.string()).max(5),
  })),
  async (c) => {
    const db = createDb(c.env.DB)
    const data = c.req.valid('json')

    const result = await db.batch([
      db.insert(posts).values({
        title: data.title,
        body: data.body,
        slug: data.slug,
      }).returning(),

      ...data.tagNames.map((name) =>
        db.insert(tags).values({ name }).onConflictDoNothing()
      ),
    ])

    return c.json({ post: result[0][0] }, 201)
  }
)
// #endregion

export default app
