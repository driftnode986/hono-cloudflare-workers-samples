# Ch07: Blog API Project

Full blog API combining D1, R2, and JWT authentication.

## Topics

- Project structure with `routes/`, `db/`, `middleware/` directories
- Drizzle ORM schema with relationships (`users` and `posts`)
- User registration and login with password hashing (Web Crypto)
- JWT-based authentication middleware
- Blog posts CRUD with authorization
- Cover image upload to R2 and serving with cache headers
- CORS and error handling configuration

## Project Structure

```
src/
  index.ts           # App entry, middleware, route mounting
  db/
    schema.ts        # Drizzle ORM schema (users, posts)
  middleware/
    auth.ts          # JWT auth and role-based middleware
  routes/
    auth.ts          # Register and login endpoints
    posts.ts         # Posts CRUD with image upload
```

## Setup

```bash
npm install

# Create D1 database and R2 bucket
wrangler d1 create blog-db
wrangler r2 bucket create blog-images

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
# Register
curl -X POST http://localhost:8787/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"author@example.com","password":"password123","name":"Author"}'

# Login
curl -X POST http://localhost:8787/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"author@example.com","password":"password123"}'

# Create post (with token)
TOKEN="<paste token>"
curl -X POST http://localhost:8787/posts \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"My First Post","slug":"my-first-post","body":"Hello!","status":"published"}'

# List published posts
curl http://localhost:8787/posts
```
