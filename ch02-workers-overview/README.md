# Ch02: Cloudflare Workers Overview

Cloudflare Workers runtime, Wrangler configuration, and bindings introduction.

## Topics

- Workers Runtime and the `workerd` execution model
- Wrangler configuration (`wrangler.toml`)
- Binding types: D1, R2, KV
- Type-safe bindings with `Hono<{ Bindings: Bindings }>`
- Request metadata via `c.req.raw.cf`
- Scheduled event handlers (cron triggers)
- ESM module format (`export default`)

## Run

```bash
npm install
npm run dev
```

Before running, create local bindings:

```bash
wrangler d1 create my-database
wrangler r2 bucket create my-bucket
wrangler kv namespace create KV
```

Update `wrangler.toml` with the returned IDs.

## Test endpoints

```bash
curl http://localhost:8787/
curl http://localhost:8787/info
curl http://localhost:8787/d1/check
curl http://localhost:8787/r2/check
curl http://localhost:8787/kv/check
```
