// #region seed-tenant
// test/helpers/seed.ts
import { hashKey } from '../../src/routes/api-keys'

export async function seedTenant(
  db: D1Database,
  tenantId: string,
  rawKey: string,
  plan = 'free'
) {
  await db
    .prepare('INSERT INTO tenants (id, name, plan) VALUES (?, ?, ?)')
    .bind(tenantId, tenantId, plan)
    .run()
  await db
    .prepare(
      'INSERT INTO api_keys (id, tenant_id, key_hash, key_prefix, name)' +
        ' VALUES (?, ?, ?, ?, ?)'
    )
    .bind(
      `key-${tenantId}`,
      tenantId,
      await hashKey(rawKey),
      rawKey.slice(0, 16),
      'test'
    )
    .run()
}
// #endregion
