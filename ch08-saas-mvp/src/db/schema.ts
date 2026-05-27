// src/db/schema.ts — SaaS MVP database schema
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: text('plan', { enum: ['free', 'pro', 'enterprise'] }).notNull().default('free'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  scopes: text('scopes').notNull().default('read'),
  lastUsedAt: text('last_used_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  type: text('type').notNull(),
  payload: text('payload').notNull(),
  status: text('status', { enum: ['pending', 'processing', 'completed', 'failed'] })
    .notNull()
    .default('pending'),
  result: text('result'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  completedAt: text('completed_at'),
});
