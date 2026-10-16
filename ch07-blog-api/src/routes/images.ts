// src/routes/images.ts
import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import { createDb } from '../db'
import { posts } from '../db/schema'
import { authMiddleware } from '../middleware/auth'
import type { Bindings } from '../types'

const images = new Hono<{ Bindings: Bindings }>()

images.post('/:slug/image', authMiddleware, async (c) => {
  const slug = c.req.param('slug')
  const payload = c.get('jwtPayload')
  const authorId = parseInt(payload.sub as string, 10)
  const db = createDb(c.env.DB)

  const post = await db.query.posts.findFirst({
    where: and(eq(posts.slug, slug), eq(posts.authorId, authorId))
  })
  if (!post) {
    return c.json({ error: 'Post not found or not authorized' }, 404)
  }

  const formData = await c.req.formData()
  const file = formData.get('image')
  if (!file || !(file instanceof File)) {
    return c.json({ error: 'No image file provided' }, 400)
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: 'Unsupported image format. Use JPEG, PNG, or WebP' }, 400)
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return c.json({ error: 'Image size exceeds 5 MB limit' }, 400)
  }

  if (post.coverImageKey) {
    await c.env.IMAGES_BUCKET.delete(post.coverImageKey)
  }

  const key = `covers/${slug}/${Date.now()}-${file.name}`
  await c.env.IMAGES_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type }
  })

  await db.update(posts)
    .set({
      coverImageKey: key,
      updatedAt: new Date().toISOString()
    })
    .where(eq(posts.slug, slug))

  return c.json({ key, message: 'Image uploaded' }, 201)
})
images.get('/file/*', async (c) => {
  const key = c.req.path.replace('/api/images/file/', '')
  const object = await c.env.IMAGES_BUCKET.get(key)

  if (!object) {
    return c.json({ error: 'Image not found' }, 404)
  }

  const headers = new Headers()
  headers.set('content-type', object.httpMetadata?.contentType ?? 'image/jpeg')
  headers.set('cache-control', 'public, max-age=86400')
  headers.set('etag', object.httpEtag)

  return new Response(object.body, { headers })
})

export { images }
