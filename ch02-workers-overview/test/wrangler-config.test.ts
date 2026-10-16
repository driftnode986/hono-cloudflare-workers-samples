import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { unstable_readConfig } from 'wrangler'

const read = (file: string) => readFileSync(file, 'utf8')

// 本文の wrangler.toml の後ろに、断片を足した設定を Wrangler で読む
function readWith(fragments: string[], env?: string) {
  const dir = mkdtempSync(join(tmpdir(), 'ch02-cfg-'))
  const path = join(dir, 'wrangler.toml')
  const base = read('wrangler.toml').replace(
    /^main = .*$/m,
    `main = "${process.cwd()}/src/index.ts"`,
  )
  writeFileSync(path, [base, ...fragments].join('\n'))
  return unstable_readConfig({ config: path, env })
}

describe('wrangler.toml (2.2 - 2.6)', () => {
  it('first deploy config (2.6)', () => {
    const config = unstable_readConfig({ config: 'wrangler.toml' })
    expect(config.name).toBe('my-first-worker')
    expect(config.compatibility_date).toBe('2026-05-27')
  })

  it('basic settings with nodejs_compat (2.2)', () => {
    const config = unstable_readConfig({
      config: 'wrangler-examples/nodejs-compat.toml',
    })
    expect(config.name).toBe('my-hono-app')
    expect(config.compatibility_flags).toEqual(['nodejs_compat'])
  })

  it('D1 / R2 / KV / AI bindings (2.3)', () => {
    const config = readWith([
      read('wrangler-examples/d1.toml'),
      read('wrangler-examples/r2.toml'),
      read('wrangler-examples/kv.toml'),
      read('wrangler-examples/ai.toml'),
    ])
    expect(config.d1_databases[0].binding).toBe('DB')
    expect(config.r2_buckets[0].binding).toBe('BUCKET')
    expect(config.kv_namespaces[0].binding).toBe('CACHE')
    expect(config.ai?.binding).toBe('AI')
  })

  it('[vars] and per environment vars (2.5)', () => {
    const vars = [read('wrangler-examples/vars.toml')]
    expect(readWith(vars).vars).toEqual({
      API_HOST: 'api.example.com',
      APP_NAME: 'my-app',
    })
    expect(readWith(vars, 'staging').vars).toEqual({
      API_HOST: 'staging.example.com',
    })
    expect(readWith(vars, 'production').vars).toEqual({
      API_HOST: 'production.example.com',
    })
  })
})
