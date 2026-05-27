// src/index.ts — Ch03: TypeScript API Patterns
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const app = new Hono();

// --- Zod schemas ---
const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
});

const updateUserSchema = createUserSchema.partial();

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['name', 'email', 'createdAt']).default('createdAt'),
});

// --- Type inference from schemas ---
type CreateUser = z.infer<typeof createUserSchema>;
type UpdateUser = z.infer<typeof updateUserSchema>;

// --- Routes with Zod validation ---
const users = new Hono();

// GET /users?page=1&limit=20&sort=name
users.get('/', zValidator('query', querySchema), (c) => {
  const { page, limit, sort } = c.req.valid('query');
  return c.json({
    data: [],
    pagination: { page, limit, sort, total: 0 },
  });
});

// POST /users — validated JSON body
users.post('/', zValidator('json', createUserSchema), (c) => {
  const userData = c.req.valid('json');
  const user = {
    id: crypto.randomUUID(),
    ...userData,
    createdAt: new Date().toISOString(),
  };
  return c.json(user, 201);
});

// PUT /users/:id — partial update
users.put(
  '/:id',
  zValidator('json', updateUserSchema),
  (c) => {
    const id = c.req.param('id');
    const updates = c.req.valid('json');
    return c.json({ id, ...updates, updatedAt: new Date().toISOString() });
  }
);

// --- RPC mode: typed routes for client ---
const rpc = new Hono()
  .get('/posts', (c) => {
    return c.json({
      posts: [
        { id: '1', title: 'Hello Hono', body: 'First post' },
        { id: '2', title: 'TypeScript Tips', body: 'Type safety' },
      ],
    });
  })
  .post(
    '/posts',
    zValidator(
      'json',
      z.object({
        title: z.string().min(1),
        body: z.string().min(1),
      })
    ),
    (c) => {
      const data = c.req.valid('json');
      return c.json(
        { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() },
        201
      );
    }
  )
  .get('/posts/:id', (c) => {
    const id = c.req.param('id');
    return c.json({ id, title: 'Sample Post', body: 'Content here' });
  });

// Mount routes
app.route('/users', users);
app.route('/rpc', rpc);

// Export type for RPC client (hc)
export type AppType = typeof rpc;

export default app;
