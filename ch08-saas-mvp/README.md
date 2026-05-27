# Ch08: SaaS MVP Backend

Multi-tenant SaaS backend with Durable Objects, Queues, and API key auth.

## Topics

- Multi-tenant data model (`tenants`, `apiKeys`, `tasks`)
- API key authentication middleware
- Durable Objects for per-tenant rate limiting
- Queues for async task processing (producer + consumer)
- Task lifecycle: `pending` -> `processing` -> `completed` / `failed`
- Tenant onboarding with automatic API key generation

## Project Structure

```
src/
  index.ts           # App entry, Queue consumer, Durable Object
  db/
    schema.ts        # Drizzle ORM schema (tenants, apiKeys, tasks)
  middleware/
    api-key.ts       # API key auth middleware
  routes/
    tenants.ts       # Tenant management endpoints
```

## Setup

```bash
npm install

# Create D1 database
wrangler d1 create saas-db

# Create Queue
wrangler queues create saas-tasks

# Update wrangler.toml with the returned IDs

# Generate and apply migrations
npm run db:generate
npm run db:migrate
```

## Run

```bash
npm run dev
```

## Test endpoints

```bash
# Create tenant (returns API key)
curl -X POST http://localhost:8787/tenants \
  -H 'Content-Type: application/json' \
  -d '{"name":"Acme Corp","slug":"acme","plan":"pro"}'

# Submit task with API key
API_KEY="<paste key from tenant creation>"
curl -X POST http://localhost:8787/api/tasks \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"type":"process-data","payload":{"input":"hello"}}'

# Check task status
curl http://localhost:8787/api/tasks/1 \
  -H "Authorization: Bearer $API_KEY"
```
