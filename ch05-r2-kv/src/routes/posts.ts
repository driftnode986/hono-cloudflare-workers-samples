// src/routes/posts.ts
// #region cached-list
import { Hono } from 'hono'
import type { AppEnv } from '../types'
import { createDb } from '../db'
import { posts as postsTable } from '../db/schema'
import { kvCache } from '../middleware/kv-cache'

const app = new Hono<AppEnv>()

app.get('/posts', kvCache(600), async (c) => {
  // D1 クエリ (キャッシュ MISS 時のみ実行)
  const db = createDb(c.env.DB)
  const posts = await db
    .select({
      id: postsTable.id,
      title: postsTable.title,
      createdAt: postsTable.createdAt,
    })
    .from(postsTable)
    .limit(20)
  return c.json({ posts })
})

export default app
// #endregion
