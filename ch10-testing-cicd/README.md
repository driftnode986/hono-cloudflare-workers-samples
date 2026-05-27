# Ch10: Testing and CI/CD

Testing with Vitest + Cloudflare Workers pool, and CI/CD with GitHub Actions.

## Topics

- Vitest configuration with `@cloudflare/vitest-pool-workers`
- Integration testing with real Workers runtime (D1 bindings)
- `app.request()` for testing Hono handlers
- D1 schema setup in `beforeAll` hooks
- CRUD test patterns (create, read, list, delete, error cases)
- GitHub Actions workflow: type check -> test -> deploy
- `cloudflare/wrangler-action` for automated deployment
- Environment secrets management (`CLOUDFLARE_API_TOKEN`)

## Project Structure

```
src/
  index.ts                    # App with items CRUD
test/
  index.test.ts               # Integration tests
.github/
  workflows/
    deploy.yml                # CI/CD pipeline
vitest.config.ts              # Workers pool configuration
```

## Setup

```bash
npm install

# Create D1 database
wrangler d1 create test-db

# Update wrangler.toml with the returned database_id
```

## Run tests

```bash
npm test
```

## Run locally

```bash
npm run dev
```

## CI/CD Setup

Add the following secrets to your GitHub repository:

- `CLOUDFLARE_API_TOKEN`: API token with Workers permissions
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

The workflow runs tests on every push/PR, and deploys on merge to `main`.
