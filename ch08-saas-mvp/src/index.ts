// src/index.ts — Ch08: SaaS MVP Backend
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { tasks } from './db/schema';
import { apiKeyAuth } from './middleware/api-key';
import tenantRoutes from './routes/tenants';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  TASK_QUEUE: Queue;
  RATE_LIMITER: DurableObjectNamespace;
};

const app = new Hono<{ Bindings: Bindings; Variables: { tenantId: string; apiKeyScopes: string } }>();

app.use('*', logger());

// --- Health check ---
app.get('/', (c) => {
  return c.json({
    name: 'SaaS MVP API',
    version: '1.0.0',
    endpoints: ['/tenants', '/api/tasks'],
  });
});

// --- Tenant management (admin) ---
app.route('/tenants', tenantRoutes);

// --- API routes (API key auth) ---
app.use('/api/*', apiKeyAuth);

// Submit async task via Queue
app.post('/api/tasks', async (c) => {
  const tenantId = c.get('tenantId');
  const body = await c.req.json<{ type: string; payload: Record<string, unknown> }>();

  const db = drizzle(c.env.DB);
  const task = await db
    .insert(tasks)
    .values({
      tenantId,
      type: body.type,
      payload: JSON.stringify(body.payload),
    })
    .returning()
    .get();

  // Enqueue for async processing
  await c.env.TASK_QUEUE.send({
    taskId: task.id,
    tenantId,
    type: body.type,
    payload: body.payload,
  });

  return c.json({ taskId: task.id, status: 'pending' }, 202);
});

// Check task status
app.get('/api/tasks/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const tenantId = c.get('tenantId');
  const db = drizzle(c.env.DB);

  const task = await db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!task || task.tenantId !== tenantId) {
    return c.json({ error: 'Task not found' }, 404);
  }

  return c.json(task);
});

// --- Durable Object: Rate Limiter ---
export class RateLimiter implements DurableObject {
  private state: DurableObjectState;
  private requests: number[] = [];

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const now = Date.now();
    const windowMs = 60_000; // 1 minute
    const limit = 100;

    this.requests = this.requests.filter((t) => t > now - windowMs);

    if (this.requests.length >= limit) {
      return Response.json({ allowed: false, remaining: 0 }, { status: 429 });
    }

    this.requests.push(now);
    return Response.json({ allowed: true, remaining: limit - this.requests.length });
  }
}

// --- Queue consumer ---
export default {
  fetch: app.fetch,

  async queue(batch: MessageBatch, env: Bindings) {
    const db = drizzle(env.DB);

    for (const message of batch.messages) {
      const { taskId, type, payload } = message.body as {
        taskId: number;
        tenantId: string;
        type: string;
        payload: Record<string, unknown>;
      };

      try {
        await db
          .update(tasks)
          .set({ status: 'processing' })
          .where(eq(tasks.id, taskId));

        // Simulate task processing
        const result = JSON.stringify({ processed: type, input: payload });

        await db
          .update(tasks)
          .set({ status: 'completed', result, completedAt: new Date().toISOString() })
          .where(eq(tasks.id, taskId));

        message.ack();
      } catch (error) {
        await db
          .update(tasks)
          .set({ status: 'failed', result: String(error) })
          .where(eq(tasks.id, taskId));
        message.retry();
      }
    }
  },
};
