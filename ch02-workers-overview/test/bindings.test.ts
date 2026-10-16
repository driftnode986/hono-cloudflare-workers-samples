import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPlatformProxy } from 'wrangler'
import app from '../src/binding-usage'

// 本文の wrangler.toml に D1 / R2 / KV のブロックを足した設定で、
// ローカルの本物のバインディング (Miniflare) を用意する
const dir = mkdtempSync(join(tmpdir(), 'ch02-'))
const configPath = join(dir, 'wrangler.toml')
const base = readFileSync('wrangler.toml', 'utf8').replace(
  /^main = .*$/m,
  `main = "${process.cwd()}/src/index.ts"`,
)
const parts = ['d1', 'r2', 'kv'].map((n) =>
  readFileSync(`wrangler-examples/${n}.toml`, 'utf8'),
)
writeFileSync(configPath, [base, ...parts].join('\n'))

type Proxy = Awaited<ReturnType<typeof getPlatformProxy<Env>>>
let proxy: Proxy
let env: Record<string, unknown>

beforeAll(async () => {
  proxy = await getPlatformProxy({ configPath, persist: false })
  env = proxy.env as unknown as Record<string, unknown>
  const db = env.DB as D1Database
  await db.exec('CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT)')
  await db.exec("INSERT INTO users VALUES ('1', 'Alice')")
})

afterAll(async () => {
  await proxy.dispose()
})

describe('bindings (2.3)', () => {
  it('D1: prepare / bind / all returns the matching row', async () => {
    const res = await app.request('/users/1', {}, env)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: '1', name: 'Alice' }])
    const none = await app.request('/users/2', {}, env)
    expect(await none.json()).toEqual([])
  })

  it('R2: put stores the object, get reads it back', async () => {
    const first = await app.request(
      '/photo',
      { method: 'PUT', body: 'abc' },
      env,
    )
    expect(await first.json()).toEqual({ replaced: false })
    const stored = await (env.BUCKET as R2Bucket).get('images/photo.jpg')
    expect(await stored!.text()).toBe('abc')
    const second = await app.request(
      '/photo',
      { method: 'PUT', body: 'def' },
      env,
    )
    expect(await second.json()).toEqual({ replaced: true })
  })

  it('KV: put writes JSON, get reads the previous value', async () => {
    const first = await app.request(
      '/session',
      { method: 'POST', body: JSON.stringify({ user: 'a' }) },
      env,
    )
    expect(await first.json()).toEqual({ previous: null })
    const kv = env.CACHE as KVNamespace
    expect(await kv.get('session:abc123')).toBe('{"user":"a"}')
    const second = await app.request(
      '/session',
      { method: 'POST', body: '{}' },
      env,
    )
    expect(await second.json()).toEqual({ previous: '{"user":"a"}' })
  })
})
