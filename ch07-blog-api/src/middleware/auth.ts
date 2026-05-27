// src/middleware/auth.ts — JWT auth middleware
import { createMiddleware } from 'hono/factory';
import { jwt } from 'hono/jwt';

type Env = {
  Bindings: { JWT_SECRET: string };
  Variables: { userId: string; userRole: string };
};

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  await jwtMiddleware(c, async () => {
    const payload = c.get('jwtPayload') as { sub: string; role: string };
    c.set('userId', payload.sub);
    c.set('userRole', payload.role);
    await next();
  });
});

export const adminOnly = createMiddleware<Env>(async (c, next) => {
  const role = c.get('userRole');
  if (role !== 'admin') {
    return c.json({ error: 'Forbidden: admin only' }, 403);
  }
  await next();
});
