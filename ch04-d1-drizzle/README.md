# Ch04: D1 Database with Drizzle ORM

D1 database setup, Drizzle ORM schema, migrations, and CRUD operations.

## Topics

- D1 database creation and binding configuration
- Drizzle ORM schema definition with `sqliteTable`
- Column types: `text`, `integer`, primary keys, unique constraints
- Default values with `$defaultFn`
- CRUD operations: `select`, `insert`, `update`, `delete`
- Query filtering with `eq` and other operators
- Drizzle Kit migration workflow (`generate` / `push`)

## Setup

```bash
npm install

# Create D1 database
wrangler d1 create my-database

# Update wrangler.toml with the returned database_id

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
# Create a post
curl -X POST http://localhost:8787/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hello D1","body":"First post with Drizzle","slug":"hello-d1"}'

# List posts
curl http://localhost:8787/posts

# Get single post
curl http://localhost:8787/posts/1

# Update post
curl -X PUT http://localhost:8787/posts/1 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Updated Title"}'

# Delete post
curl -X DELETE http://localhost:8787/posts/1
```
