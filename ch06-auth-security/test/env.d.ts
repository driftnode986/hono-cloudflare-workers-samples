// テスト用: cloudflare:workers の env に wrangler.toml とテスト設定のバインディングの型を与える
import type { D1Migration } from '@cloudflare/vitest-pool-workers'

declare global {
  namespace Cloudflare {
    interface Env {
      DB: D1Database
      RATE_KV: KVNamespace
      JWT_SECRET: string
      ENVIRONMENT: string
      ALLOWED_ORIGIN: string
      API_KEY: string
      API_KEYS: string
      TEST_MIGRATIONS: D1Migration[]
    }
  }
}
