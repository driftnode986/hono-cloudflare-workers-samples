// test/index.test.ts — Integration tests with Workers pool
import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import app from '../src/index';

// Apply D1 migrations before tests
beforeAll(async () => {
  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
});

describe('Health check', () => {
  it('GET / returns status ok', async () => {
    const res = await app.request('/', {}, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});

describe('Items CRUD', () => {
  it('POST /items creates an item', async () => {
    const res = await app.request(
      '/items',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Item', description: 'A test' }),
      },
      env
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('Test Item');
    expect(body.id).toBeDefined();
  });

  it('GET /items lists items', async () => {
    const res = await app.request('/items', {}, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('GET /items/:id returns a single item', async () => {
    const res = await app.request('/items/1', {}, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Test Item');
  });

  it('GET /items/:id returns 404 for missing item', async () => {
    const res = await app.request('/items/9999', {}, env);
    expect(res.status).toBe(404);
  });

  it('DELETE /items/:id deletes an item', async () => {
    const res = await app.request('/items/1', { method: 'DELETE' }, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe('Deleted');
  });

  it('POST /items returns 400 without name', async () => {
    const res = await app.request(
      '/items',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'No name' }),
      },
      env
    );
    expect(res.status).toBe(400);
  });
});
