import { describe, expect, it } from 'vitest'
import { parse } from 'smol-toml'
import wranglerToml from '../wrangler.toml?raw'
import r2Toml from '../steps/wrangler.r2.toml?raw'
import vectorizeToml from '../steps/wrangler.vectorize.toml?raw'
import kvToml from '../steps/wrangler.kv.toml?raw'

const stepFiles: Record<string, string> = {
  'steps/wrangler.r2.toml': r2Toml,
  'steps/wrangler.vectorize.toml': vectorizeToml,
  'steps/wrangler.kv.toml': kvToml
}

describe('wrangler.toml', () => {
  const config = parse(wranglerToml) as Record<string, any>

  it('Worker の基本設定と AI バインディング', () => {
    expect(config.main).toBe('src/index.ts')
    expect(config.ai).toEqual({ binding: 'AI' })
  })

  it('コードが使う 3 つのバインディングが宣言されている', () => {
    expect(config.r2_buckets).toEqual([
      { binding: 'IMAGES_BUCKET', bucket_name: 'ai-images' }
    ])
    expect(config.vectorize).toEqual([
      { binding: 'VECTOR_INDEX', index_name: 'my-index' }
    ])
    expect(config.kv_namespaces[0].binding).toBe('AI_CACHE')
  })
})

describe('steps/wrangler.*.toml（本文の途中の版）', () => {
  it.each([
    ['steps/wrangler.r2.toml', 'r2_buckets', 'IMAGES_BUCKET'],
    ['steps/wrangler.vectorize.toml', 'vectorize', 'VECTOR_INDEX'],
    ['steps/wrangler.kv.toml', 'kv_namespaces', 'AI_CACHE']
  ])('%s は AI と %s を宣言する', (path, key, binding) => {
    const config = parse(stepFiles[path]) as Record<string, any>
    expect(config.ai).toEqual({ binding: 'AI' })
    expect(config[key]).toHaveLength(1)
    expect(config[key][0].binding).toBe(binding)
  })
})
