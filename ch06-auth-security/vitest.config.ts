// vitest.config.ts
import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.toml' },
      // シークレットは wrangler.toml に書かない。テスト用の値だけここで渡す
      miniflare: {
        bindings: {
          API_KEY: 'test-api-key',
          API_KEYS: 'key-a,key-b',
        },
      },
    }),
  ],
})
