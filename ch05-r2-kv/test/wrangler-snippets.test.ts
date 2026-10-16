// test/wrangler-snippets.test.ts
// 本文に出てくる wrangler.toml の断片が、TOML として正しく、期待するバインディングを持つことを確かめる
import { describe, it, expect } from 'vitest'
import { parse } from 'smol-toml'
import main from '../wrangler.toml?raw'
import r2 from '../src/steps/wrangler.r2.toml?raw'
import kv from '../src/steps/wrangler.kv.toml?raw'

type Parsed = {
  r2_buckets?: { binding: string; bucket_name: string }[]
  kv_namespaces?: { binding: string; id: string; preview_id?: string }[]
  d1_databases?: { binding: string }[]
}

describe('wrangler.toml snippets', () => {
  it('5.2: R2 binding FILES_BUCKET', () => {
    const t = parse(r2) as Parsed
    expect(t.r2_buckets).toEqual([
      { binding: 'FILES_BUCKET', bucket_name: 'my-files' },
    ])
  })

  it('5.6: KV binding MY_KV', () => {
    const a = parse(kv) as Parsed
    expect(a.kv_namespaces?.[0].binding).toBe('MY_KV')
    expect(a.kv_namespaces?.[0].preview_id).toBeUndefined()
  })

  it('5.10: the unified file binds D1, R2 and both KV namespaces', () => {
    const t = parse(main) as Parsed
    expect(t.d1_databases?.map((d) => d.binding)).toEqual(['DB'])
    expect(t.r2_buckets?.map((r) => r.binding)).toEqual(['FILES_BUCKET'])
    expect(t.kv_namespaces?.map((k) => k.binding)).toEqual(
      expect.arrayContaining(['CACHE_KV', 'SESSION_KV'])
    )
  })
})
