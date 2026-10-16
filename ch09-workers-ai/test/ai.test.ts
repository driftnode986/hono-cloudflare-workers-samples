import { describe, expect, it } from 'vitest'
import app from '../src/index'
import {
  fakeAi,
  fakeKV,
  fakeR2,
  fakeVectorize,
  jsonPost,
  toBase64
} from './helpers/fakes'

const textAnswer = { response: 'こんにちは' }

describe('POST /ai/generate', () => {
  it('prompt をモデルに渡し、結果を JSON で返す', async () => {
    const { ai, calls } = fakeAi(() => textAnswer)
    const res = await app.request(
      '/ai/generate',
      jsonPost({ prompt: 'Hello' }),
      { AI: ai }
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(textAnswer)
    expect(calls[0].model).toBe('@cf/meta/llama-3.1-8b-instruct')
    expect(calls[0].input).toEqual({ prompt: 'Hello' })
  })
})

describe('POST /ai/stream', () => {
  it('SSE のストリームをそのまま返す', async () => {
    const encoder = new TextEncoder()
    const { ai, calls } = fakeAi(
      () =>
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('data: {"response":"a"}\n\n'))
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          }
        })
    )
    const res = await app.request(
      '/ai/stream',
      jsonPost({ message: 'hi' }),
      { AI: ai }
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/event-stream')
    expect(await res.text()).toBe(
      'data: {"response":"a"}\n\ndata: [DONE]\n\n'
    )
    expect(calls[0].input.stream).toBe(true)
  })
})

describe('POST /ai/image', () => {
  it('Base64 の画像を復号してバイナリで返す', async () => {
    const bytes = [0xff, 0xd8, 0xff, 0x00, 0x7f, 0x80]
    const { ai } = fakeAi(() => ({ image: toBase64(bytes) }))
    const res = await app.request(
      '/ai/image',
      jsonPost({ prompt: 'a city' }),
      { AI: ai }
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/jpeg')
    expect([...new Uint8Array(await res.arrayBuffer())]).toEqual(bytes)
  })

  it('画像が返らなかったときは 500 になる', async () => {
    const { ai } = fakeAi(() => ({}))
    const res = await app.request(
      '/ai/image',
      jsonPost({ prompt: 'a city' }),
      { AI: ai }
    )
    expect(res.status).toBe(500)
  })
})

describe('POST /ai/image/save', () => {
  it('画像を R2 に保存し、キーを返す', async () => {
    const bytes = [1, 2, 3, 250]
    const { ai } = fakeAi(() => ({ image: toBase64(bytes) }))
    const { bucket, objects } = fakeR2()
    const res = await app.request(
      '/ai/image/save',
      jsonPost({ prompt: 'a city' }),
      { AI: ai, IMAGES_BUCKET: bucket }
    )
    expect(res.status).toBe(200)
    const body = await res.json<{ key: string; message: string }>()
    expect(body.key).toMatch(/^generated\/\d+\.jpg$/)
    const saved = objects.get(body.key)
    expect([...(saved?.bytes ?? [])]).toEqual(bytes)
    expect(saved?.contentType).toBe('image/jpeg')
  })
})

describe('POST /ai/embed', () => {
  it('ベクトルと次元数を返す', async () => {
    const { ai, calls } = fakeAi(() => ({
      shape: [1, 3],
      data: [[0.1, 0.2, 0.3]]
    }))
    const res = await app.request('/ai/embed', jsonPost({ text: 'abc' }), {
      AI: ai
    })
    expect(await res.json()).toEqual({
      vector: [0.1, 0.2, 0.3],
      dimensions: 3
    })
    expect(calls[0].model).toBe('@cf/baai/bge-base-en-v1.5')
    expect(calls[0].input).toEqual({ text: ['abc'] })
  })

  it('同期の結果でない応答（data なし）は 500 になる', async () => {
    const { ai } = fakeAi(() => ({ request_id: 'r-1' }))
    const res = await app.request('/ai/embed', jsonPost({ text: 'abc' }), {
      AI: ai
    })
    expect(res.status).toBe(500)
  })
})

describe('POST /ai/similarity', () => {
  const run = async (vectors: number[][]) => {
    const { ai } = fakeAi(() => ({ data: vectors }))
    const res = await app.request(
      '/ai/similarity',
      jsonPost({ text1: 'a', text2: 'b' }),
      { AI: ai }
    )
    return res.json<{ similarity: number }>()
  }

  it('同じ向きのベクトルは 1', async () => {
    const body = await run([[1, 2, 3], [2, 4, 6]])
    expect(body.similarity).toBeCloseTo(1, 10)
  })

  it('直交するベクトルは 0', async () => {
    const body = await run([[1, 0], [0, 1]])
    expect(body.similarity).toBeCloseTo(0, 10)
  })

  it('テキストと類似度を一緒に返す', async () => {
    const body = await run([[1, 0], [1, 1]])
    expect(body).toMatchObject({ text1: 'a', text2: 'b' })
    expect(body.similarity).toBeCloseTo(Math.SQRT1_2, 10)
  })
})

describe('Vectorize', () => {
  it('POST /ai/index: 埋め込みを作って upsert する', async () => {
    const { ai } = fakeAi(() => ({ data: [[0.5, 0.5]] }))
    const { index, upserts } = fakeVectorize()
    const res = await app.request(
      '/ai/index',
      jsonPost({ id: 'doc-1', text: 'hello' }),
      { AI: ai, VECTOR_INDEX: index }
    )
    expect(await res.json()).toEqual({ id: 'doc-1', indexed: true })
    expect(upserts).toEqual([[{ id: 'doc-1', values: [0.5, 0.5] }]])
  })

  it('POST /ai/search: topK 5 で検索し、マッチを返す', async () => {
    const matches = [{ id: 'doc-1', score: 0.9 }]
    const { ai } = fakeAi(() => ({ data: [[0.1, 0.9]] }))
    const { index, queries } = fakeVectorize(matches)
    const res = await app.request(
      '/ai/search',
      jsonPost({ query: 'hello' }),
      { AI: ai, VECTOR_INDEX: index }
    )
    expect(await res.json()).toEqual({ query: 'hello', matches })
    expect(queries[0]).toEqual({ vector: [0.1, 0.9], options: { topK: 5 } })
  })
})

describe('POST /ai/text', () => {
  it('成功時は結果をそのまま返す', async () => {
    const { ai } = fakeAi(() => textAnswer)
    const res = await app.request('/ai/text', jsonPost({ message: 'hi' }), {
      AI: ai
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(textAnswer)
  })

  it('推論が Error で失敗したら 500 と detail を返す', async () => {
    const { ai } = fakeAi(() => {
      throw new Error('rate limited')
    })
    const res = await app.request('/ai/text', jsonPost({ message: 'hi' }), {
      AI: ai
    })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({
      error: 'AI inference failed',
      detail: 'rate limited'
    })
  })

  it('Error 以外が投げられたら Unknown error を返す', async () => {
    const { ai } = fakeAi(() => {
      throw 'boom'
    })
    const res = await app.request('/ai/text', jsonPost({ message: 'hi' }), {
      AI: ai
    })
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Unknown error' })
  })
})

describe('POST /ai/chat (Zod)', () => {
  it('maxTokens 未指定なら 512 を使う', async () => {
    const { ai, calls } = fakeAi(() => textAnswer)
    const res = await app.request('/ai/chat', jsonPost({ message: 'hi' }), {
      AI: ai
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(textAnswer)
    expect(calls[0].input.max_tokens).toBe(512)
  })

  it('maxTokens を指定するとその値を使う', async () => {
    const { ai, calls } = fakeAi(() => textAnswer)
    await app.request(
      '/ai/chat',
      jsonPost({ message: 'hi', maxTokens: 1024 }),
      { AI: ai }
    )
    expect(calls[0].input.max_tokens).toBe(1024)
  })

  it.each([
    ['空の message', { message: '' }],
    ['2001 文字の message', { message: 'a'.repeat(2001) }],
    ['64 未満の maxTokens', { message: 'hi', maxTokens: 63 }],
    ['2048 超の maxTokens', { message: 'hi', maxTokens: 2049 }],
    ['整数でない maxTokens', { message: 'hi', maxTokens: 100.5 }]
  ])('%s は 400 で、AI を呼ばない', async (_name, body) => {
    const { ai, calls } = fakeAi(() => textAnswer)
    const res = await app.request('/ai/chat', jsonPost(body), { AI: ai })
    expect(res.status).toBe(400)
    expect(calls).toHaveLength(0)
  })
})

describe('POST /ai/gateway-chat', () => {
  it('第 3 引数で AI Gateway の ID を渡す', async () => {
    const { ai, calls } = fakeAi(() => textAnswer)
    const res = await app.request(
      '/ai/gateway-chat',
      { method: 'POST' },
      { AI: ai }
    )
    expect(res.status).toBe(200)
    expect(calls[0].options).toEqual({ gateway: { id: 'my-ai-gateway' } })
  })
})

describe('POST /ai/cached-chat', () => {
  it('1 回目は AI を呼んで KV に保存し、2 回目は KV から返す', async () => {
    const { ai, calls } = fakeAi(() => textAnswer)
    const { kv, store } = fakeKV()
    const env = { AI: ai, AI_CACHE: kv }

    const first = await app.request(
      '/ai/cached-chat',
      jsonPost({ message: 'hi' }),
      env
    )
    expect(await first.json()).toEqual({
      response: 'こんにちは',
      cached: false
    })
    expect(store.get('ai:hi')).toEqual({ value: 'こんにちは', ttl: 3600 })

    const second = await app.request(
      '/ai/cached-chat',
      jsonPost({ message: 'hi' }),
      env
    )
    expect(await second.json()).toEqual({
      response: 'こんにちは',
      cached: true
    })
    expect(calls).toHaveLength(1)
  })

  it('メッセージが違えば別のキャッシュになる', async () => {
    const { ai, calls } = fakeAi(() => textAnswer)
    const { kv } = fakeKV()
    const env = { AI: ai, AI_CACHE: kv }
    await app.request('/ai/cached-chat', jsonPost({ message: 'a' }), env)
    await app.request('/ai/cached-chat', jsonPost({ message: 'b' }), env)
    expect(calls).toHaveLength(2)
  })
})
