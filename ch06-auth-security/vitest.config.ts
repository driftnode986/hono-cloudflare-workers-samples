// vitest.config.ts
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

export default defineConfig(async () => {
  const migrations = await readD1Migrations('./migrations')
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.toml' },
        // シークレットは wrangler.toml に書かない。テスト用の値だけここで渡す
        miniflare: {
          bindings: {
            JWT_SECRET: 'test-jwt-secret-not-for-production',
            API_KEY: 'test-api-key',
            API_KEYS: 'key-a,key-b',
            TEST_MIGRATIONS: migrations,
          },
        },
      }),
    ],
  }
})
