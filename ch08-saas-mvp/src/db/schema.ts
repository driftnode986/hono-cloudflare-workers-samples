// src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  plan: text('plan').notNull().default('free'),
  createdAt: text('created_at').default('(datetime(\'now\'))'),
})

export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  keyHash: text('key_hash').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  name: text('name').notNull(),
  lastUsedAt: text('last_used_at'),
  createdAt: text('created_at').default('(datetime(\'now\'))'),
})

export const resources = sqliteTable('resources', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  title: text('title').notNull(),
  content: text('content'),
  status: text('status').notNull().default('draft'),
  createdAt: text('created_at').default('(datetime(\'now\'))'),
  updatedAt: text('updated_at'),
})
