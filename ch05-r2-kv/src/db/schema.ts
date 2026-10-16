// src/db/schema.ts (第 4 章の posts に thumbnail_key 列を足した版)
import {
  sqliteTable,
  text,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  body: text('body').notNull(),
  slug: text('slug').notNull(),
  // #region thumbnail-column
  thumbnailKey: text('thumbnail_key'), // R2 のオブジェクトキー
  // #endregion
  publishedAt: text('published_at'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
}, (table) => [
  uniqueIndex('posts_slug_idx').on(table.slug),
  index('posts_created_at_idx').on(table.createdAt),
])
