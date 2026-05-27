# Ch06: Authentication and Security

JWT authentication, CORS, rate limiting, and password hashing.

## Topics

- JWT token creation and verification with `hono/jwt`
- CORS middleware configuration for allowed origins
- KV-based rate limiting with sliding window
- Password hashing with Web Crypto API (PBKDF2)
- Protected route middleware pattern
- Role-based authorization (admin check)
- Security headers (`X-RateLimit-Remaining`)

## Setup

```bash
npm install

# Create KV namespace for rate limiting
wrangler kv namespace create RATE_LIMIT

# Update wrangler.toml with the returned ID
# Change JWT_SECRET in production
```

## Run

```bash
npm run dev
```

## Test endpoints

```bash
# Login to get JWT token
curl -X POST http://localhost:8787/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"password123"}'

# Access protected route with token
TOKEN="<paste token from login response>"
curl http://localhost:8787/api/protected/profile \
  -H "Authorization: Bearer $TOKEN"

# Admin-only route
curl http://localhost:8787/api/protected/admin \
  -H "Authorization: Bearer $TOKEN"
```
