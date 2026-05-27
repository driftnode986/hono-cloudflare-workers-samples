# Ch05: R2 Object Storage and KV

R2 file storage, KV cache patterns, and session management.

## Topics

- R2 file upload with metadata (`put` with `httpMetadata`, `customMetadata`)
- R2 file download with proper HTTP headers and ETag
- R2 object listing with prefix filtering
- KV as a cache layer with TTL (`expirationTtl`)
- KV-based session management
- Choosing between R2 (large files) and KV (small key-value data)

## Setup

```bash
npm install

# Create R2 bucket
wrangler r2 bucket create my-files

# Create KV namespaces
wrangler kv namespace create CACHE
wrangler kv namespace create SESSIONS

# Update wrangler.toml with the returned IDs
```

## Run

```bash
npm run dev
```

## Test endpoints

```bash
# Upload a file
curl -X POST http://localhost:8787/files/hello.txt \
  -H 'Content-Type: text/plain' \
  -d 'Hello, R2!'

# Download a file
curl http://localhost:8787/files/hello.txt

# List files
curl http://localhost:8787/files

# KV cache
curl http://localhost:8787/cached/my-key

# Session management
curl -X POST http://localhost:8787/sessions \
  -H 'Content-Type: application/json' \
  -d '{"userId":"user-123"}'
```
