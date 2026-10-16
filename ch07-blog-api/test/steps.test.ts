// test/steps.test.ts
import { env } from 'cloudflare:workers'
import { applyD1Migrations } from 'cloudflare:test'
import { beforeAll, describe, expect, it } from 'vitest'
import { createDb } from '../src/db'
import { posts, users } from '../src/db/schema'
import { postsRouter } from '../src/steps/posts.get-slug.step1'

describe('step 1: GET /:slug (before ?format=html)', () => {
  beforeAll(async () => {
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
    const db = createDb(env.DB)
    const [user] = await db.insert(users).values({
      email: 's@example.com', passwordHash: 'x', name: 'Step Author',
    }).returning()
    await db.insert(posts).values({
      slug: 'step-post', title: 'Step', content: '# Step', authorId: user.id,
    })
  })

  it('returns the post without contentHtml', async () => {
    const res = await postsRouter.request('/step-post', {}, env)
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body).toMatchObject({ slug: 'step-post', authorName: 'Step Author' })
    expect(body.contentHtml).toBeUndefined()
  })

  it('returns 404 for an unknown slug', async () => {
    const res = await postsRouter.request('/none', {}, env)
    expect(res.status).toBe(404)
  })
})
