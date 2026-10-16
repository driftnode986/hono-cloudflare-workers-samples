// test/auth.test.ts
import { env } from 'cloudflare:workers'
import { applyD1Migrations } from 'cloudflare:test'
import { describe, it, expect, beforeAll } from 'vitest'
import { verify } from 'hono/jwt'
import app from '../src/index'
import { hashPassword } from '../src/lib/password'
import { call, tokenFor, bearer } from './helpers'

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
  const hash = await hashPassword('s3cret-pass')
  await env.DB
    .prepare('INSERT INTO users VALUES (?, ?, ?, ?)')
    .bind('user-1', 'alice@example.com', hash, 'admin')
    .run()
})

const login = (body: unknown, ip: string) =>
  call(app, '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
    body: JSON.stringify(body),
  })

describe('POST /auth/login', () => {
  it('returns a signed JWT for valid credentials', async () => {
    const res = await login(
      { email: 'alice@example.com', password: 's3cret-pass' },
      '10.0.0.1'
    )
    expect(res.status).toBe(200)
    const { token, expiresIn } = await res.json<{ token: string; expiresIn: number }>()
    expect(expiresIn).toBe(3600)
    const payload = await verify(token, env.JWT_SECRET, 'HS256')
    expect(payload.sub).toBe('user-1')
    expect(payload.role).toBe('admin')
    expect((payload.exp as number) - (payload.iat as number)).toBe(3600)
  })

  it('returns 401 for a wrong password', async () => {
    const res = await login(
      { email: 'alice@example.com', password: 'wrong-password' },
      '10.0.0.2'
    )
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Invalid credentials' })
  })

  it('returns the same 401 for an unknown email', async () => {
    const res = await login(
      { email: 'nobody@example.com', password: 's3cret-pass' },
      '10.0.0.3'
    )
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Invalid credentials' })
  })

  it('returns 400 for an invalid email or a short password', async () => {
    expect((await login({ email: 'not-an-email', password: 's3cret-pass' }, '10.0.0.4')).status).toBe(400)
    expect((await login({ email: 'alice@example.com', password: 'short' }, '10.0.0.4')).status).toBe(400)
  })

  it('is rate limited to 5 attempts per window per IP', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 6; i++) {
      const res = await login(
        { email: 'alice@example.com', password: 'wrong-password' },
        '10.0.0.99'
      )
      statuses.push(res.status)
    }
    expect(statuses).toEqual([401, 401, 401, 401, 401, 429])
  })
})

describe('JWT protected routes', () => {
  it('GET /posts needs no token', async () => {
    const res = await call(app, '/posts')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ posts: [] })
  })

  it('rejects /admin/* without a token (401)', async () => {
    expect((await call(app, '/admin/profile')).status).toBe(401)
    expect((await call(app, '/admin/posts', { method: 'POST' })).status).toBe(401)
  })

  it('rejects a token signed with another secret', async () => {
    const { sign } = await import('hono/jwt')
    const bad = await sign({ sub: 'x', role: 'admin' }, 'another-secret')
    const res = await call(app, '/admin/profile', { headers: bearer(bad) })
    expect(res.status).toBe(401)
  })

  it('rejects an expired token', async () => {
    const expired = await tokenFor('user-1', 'admin', -10)
    const res = await call(app, '/admin/profile', { headers: bearer(expired) })
    expect(res.status).toBe(401)
  })

  it('GET /admin/profile returns the token payload', async () => {
    const token = await tokenFor('user-7', 'editor')
    const res = await call(app, '/admin/profile', { headers: bearer(token) })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ userId: 'user-7', role: 'editor' })
  })

  it('POST /admin/posts returns 201 with a valid token', async () => {
    const token = await tokenFor('user-7', 'editor')
    const res = await call(app, '/admin/posts', { method: 'POST', headers: bearer(token) })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ message: 'Post created' })
  })

  it('DELETE /admin/posts/:id is allowed for admin only', async () => {
    const admin = await tokenFor('user-1', 'admin')
    const editor = await tokenFor('user-7', 'editor')
    const ok = await call(app, '/admin/posts/1', { method: 'DELETE', headers: bearer(admin) })
    expect(ok.status).toBe(204)
    const ng = await call(app, '/admin/posts/1', { method: 'DELETE', headers: bearer(editor) })
    expect(ng.status).toBe(403)
    expect(await ng.json()).toEqual({ error: 'Forbidden' })
  })
})

describe('POST /auth/register', () => {
  const register = (body: unknown, ip: string) =>
    call(app, '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
      body: JSON.stringify(body),
    })

  it('creates a user with role "user" and the user can log in', async () => {
    const res = await register(
      { email: 'bob@example.com', password: 'bob-password', role: 'admin' },
      '10.1.0.1'
    )
    expect(res.status).toBe(201)
    const row = await env.DB
      .prepare('SELECT role, password_hash FROM users WHERE email = ?')
      .bind('bob@example.com')
      .first<{ role: string; password_hash: string }>()
    // クライアントが role を送っても user になる。ハッシュは平文ではない
    expect(row?.role).toBe('user')
    expect(row?.password_hash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{64}$/)

    const loginRes = await login(
      { email: 'bob@example.com', password: 'bob-password' },
      '10.1.0.2'
    )
    expect(loginRes.status).toBe(200)
    const { token } = await loginRes.json<{ token: string }>()
    const payload = await verify(token, env.JWT_SECRET, 'HS256')
    expect(payload.role).toBe('user')
  })

  it('returns 409 for a registered email and 400 for a bad body', async () => {
    expect(
      (await register({ email: 'alice@example.com', password: 'whatever-pass' }, '10.1.0.3')).status
    ).toBe(409)
    expect(
      (await register({ email: 'x@example.com', password: 'short' }, '10.1.0.3')).status
    ).toBe(400)
  })
})

describe('secure headers', () => {
  it('are set on routes defined before the CORS and rate limit setup', async () => {
    const res = await call(app, '/posts')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(res.headers.get('Strict-Transport-Security')).toBeTruthy()
  })
})
