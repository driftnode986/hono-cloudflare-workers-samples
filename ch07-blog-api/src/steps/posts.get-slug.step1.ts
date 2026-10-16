// src/steps/posts.get-slug.step1.ts
// 7.4 で最初に書く記事詳細（7.6 で ?format=html 対応版に差し替える前の版）
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { createDb } from '../db'
import { posts, users } from '../db/schema'
import type { Bindings } from '../types'

export const postsRouter = new Hono<{ Bindings: Bindings }>()

// #region get-slug-basic
postsRouter.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
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

  return c.json(post[0])
})
// #endregion
