// src/index.ts — Ch06: Authentication and Security
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt, sign, verify } from 'hono/jwt';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

type Bindings = {
  JWT_SECRET: string;
  RATE_LIMIT: KVNamespace;
};

type JWTPayload = {
  sub: string;
  email: string;
  role: string;
  exp: number;
};

const app = new Hono<{ Bindings: Bindings; Variables: { jwtPayload: JWTPayload } }>();

// --- CORS configuration ---
app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:3000', 'https://example.com'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
);

// --- Rate limiting middleware ---
async function rateLimiter(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSec: number
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `rate:${key}:${Math.floor(now / windowSec)}`;
  const current = Number(await kv.get(windowKey)) || 0;

  if (current >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await kv.put(windowKey, String(current + 1), { expirationTtl: windowSec });
  return { allowed: true, remaining: limit - current - 1 };
}

app.use('/api/*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
  const { allowed, remaining } = await rateLimiter(c.env.RATE_LIMIT, ip, 100, 60);

  c.header('X-RateLimit-Remaining', String(remaining));

  if (!allowed) {
    return c.json({ error: 'Too many requests' }, 429);
  }

  await next();
});

// --- Password hashing with Web Crypto ---
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(hash);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  return btoa(String.fromCharCode(...combined));
}

// --- Auth schemas ---
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// --- Public routes ---
app.post('/api/auth/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  // In production: look up user in D1 and verify password hash
  if (email !== 'admin@example.com' || password !== 'password123') {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    sub: 'user-001',
    email,
    role: 'admin',
    exp: now + 3600, // 1 hour
  };

  const token = await sign(payload, c.env.JWT_SECRET);
  return c.json({ token, expiresIn: 3600 });
});

// --- Protected routes ---
app.use('/api/protected/*', jwt({ secret: (c) => c.env.JWT_SECRET }));

app.get('/api/protected/profile', (c) => {
  const payload = c.get('jwtPayload') as JWTPayload;
  return c.json({
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
  });
});

app.get('/api/protected/admin', (c) => {
  const payload = c.get('jwtPayload') as JWTPayload;
  if (payload.role !== 'admin') {
    return c.json({ error: 'Forbidden: admin only' }, 403);
  }
  return c.json({ message: 'Admin area', userId: payload.sub });
});

export default app;
