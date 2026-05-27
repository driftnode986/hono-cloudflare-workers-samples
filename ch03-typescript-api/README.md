# Ch03: TypeScript API Patterns

Zod validation, RPC mode, and type-safe API design with Hono.

## Topics

- Zod schema definitions for request validation
- `zValidator` middleware for body, query, and param validation
- Type inference from Zod schemas (`z.infer<typeof schema>`)
- Partial schemas for PATCH/PUT operations
- Query parameter coercion with defaults
- RPC mode with typed route chains
- Exporting `AppType` for type-safe client generation (`hc`)

## Run

```bash
npm install
npm run dev
```

## Test endpoints

```bash
# Validated query params
curl "http://localhost:8787/users?page=1&limit=10&sort=name"

# Validated JSON body
curl -X POST http://localhost:8787/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice","email":"alice@example.com","age":30}'

# Validation error (missing required field)
curl -X POST http://localhost:8787/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice"}'

# RPC routes
curl http://localhost:8787/rpc/posts
curl http://localhost:8787/rpc/posts/1
```
