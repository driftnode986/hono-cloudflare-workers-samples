// src/db/schema.ts
// #region posts-schema
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

// D1 のスキーマ (Drizzle ORM)
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  thumbnailKey: text('thumbnail_key'), // R2 のオブジェクトキー
  createdAt: text('created_at').notNull(),
})
// #endregion
