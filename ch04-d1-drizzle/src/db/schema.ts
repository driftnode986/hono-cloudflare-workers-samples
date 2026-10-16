// #region schema-posts
// src/db/schema.ts
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/sqlite-core'

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  body: text('body').notNull(),
  slug: text('slug').notNull(),
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
// #endregion

// #region schema-relations
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
})

export const postTags = sqliteTable('post_tags', {
  postId: text('post_id').notNull().references(() => posts.id),
  tagId: integer('tag_id').notNull().references(() => tags.id),
}, (table) => [
  primaryKey({ columns: [table.postId, table.tagId] }),
])
// #endregion
