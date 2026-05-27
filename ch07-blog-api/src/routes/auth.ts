// src/routes/auth.ts — Authentication routes
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';

type Env = {
  Bindings: { DB: D1Database; JWT_SECRET: string };
};

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const app = new Hono<Env>();

app.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, name } = c.req.valid('json');
  const db = drizzle(c.env.DB);

  // Check if user exists
  const existing = await db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    return c.json({ error: 'Email already registered' }, 409);
  }

  // Hash password with Web Crypto
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const combined = new Uint8Array(salt.length + new Uint8Array(hash).length);
  combined.set(salt);
  combined.set(new Uint8Array(hash), salt.length);
  const passwordHash = btoa(String.fromCharCode(...combined));

  const user = await db.insert(users).values({ email, passwordHash, name }).returning().get();
  return c.json({ id: user.id, email: user.email, name: user.name }, 201);
});

app.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const user = await db.select().from(users).where(eq(users.email, email)).get();
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // In production: verify password hash here
  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    { sub: user.id, email: user.email, role: user.role, exp: now + 3600 },
    c.env.JWT_SECRET
  );

  return c.json({ token, expiresIn: 3600 });
});

export default app;
