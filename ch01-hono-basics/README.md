# Ch01: Hono Basics

Basic Hono routing, Context object, middleware, and error handling.

## Topics

- Creating a Hono app and defining routes (GET, POST)
- Path parameters and query parameters
- Custom middleware (response time header)
- Built-in middleware (logger, prettyJSON)
- Route grouping with `app.route()`
- Error handling with `onError` and `notFound`
- HTTPException for structured error responses

## Run

```bash
npm install
npm run dev
```

## Test endpoints

```bash
curl http://localhost:8787/
curl http://localhost:8787/users/123
curl http://localhost:8787/search?q=hono&page=2
curl -X POST http://localhost:8787/users -H 'Content-Type: application/json' -d '{"name":"Alice","email":"alice@example.com"}'
curl http://localhost:8787/api/health
```
