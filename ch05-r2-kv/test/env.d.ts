// テスト用: cloudflare:workers の env に wrangler.toml のバインディングの型を与える
declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    FILES_BUCKET: R2Bucket
    CACHE_KV: KVNamespace
    SESSION_KV: KVNamespace
    MY_KV: KVNamespace
  }
}

declare module '*?raw' {
  const content: string
  export default content
}
