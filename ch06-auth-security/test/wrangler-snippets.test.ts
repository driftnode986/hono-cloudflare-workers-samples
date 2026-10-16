// test/wrangler-snippets.test.ts
// 本文に出てくる wrangler.toml の断片が、TOML として正しく、本書の設定と矛盾しないことを確かめる
import { describe, it, expect } from 'vitest'
import { parse } from 'smol-toml'
import main from '../wrangler.toml?raw'
import cors from '../src/steps/wrangler.cors.toml?raw'

type Parsed = {
  vars?: Record<string, string>
  env?: { production?: { vars?: Record<string, string> } }
  d1_databases?: { binding: string }[]
  kv_namespaces?: { binding: string }[]
}

describe('wrangler.toml snippets', () => {
  it('6.2: no secret is stored in wrangler.toml', () => {
    const t = parse(main) as Parsed
    expect(t.vars?.JWT_SECRET).toBeUndefined()
    expect(main).not.toMatch(/JWT_SECRET|API_KEY/)
  })

  it('6.5: CORS variables for development and production', () => {
    const t = parse(cors) as Parsed
    expect(t.vars).toEqual({
      ENVIRONMENT: 'development',
      ALLOWED_ORIGIN: 'http://localhost:3000',
    })
    expect(t.env?.production?.vars).toEqual({
      ENVIRONMENT: 'production',
      ALLOWED_ORIGIN: 'https://myapp.example.com',
    })
  })

  it('the chapter wrangler.toml contains both and binds DB and RATE_KV', () => {
    const t = parse(main) as Parsed
    expect(t.vars).toMatchObject(
      (parse(cors) as Parsed).vars as Record<string, string>
    )
    expect(t.env?.production?.vars).toEqual((parse(cors) as Parsed).env?.production?.vars)
    expect(t.d1_databases?.[0].binding).toBe('DB')
    expect(t.kv_namespaces?.[0].binding).toBe('RATE_KV')
  })
})
