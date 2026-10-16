// 本文で段階的に書き換わるコード（src/steps/）が、それぞれ動くことを確かめる。
import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { ai as generateAi } from '../src/steps/ai.generate'
import { ai as chatBasicAi } from '../src/steps/ai.chat-basic'
import { ai as r2Ai } from '../src/steps/ai.r2'
import { ai as vectorizeAi } from '../src/steps/ai.vectorize'
import { ai as kvAi } from '../src/steps/ai.kv'
import { ai as modularAi } from '../src/steps/ai.modular'
import step1 from '../src/steps/index.step1'
import {
  fakeAi,
  fakeKV,
  fakeR2,
  fakeVectorize,
  jsonPost,
  toBase64
} from './helpers/fakes'

const textAnswer = { response: 'こんにちは' }

describe('9.2 index.step1', () => {
  it('AI バインディングだけを持つ app で、ルートはまだ無い', async () => {
    expect(step1).toBeInstanceOf(Hono)
    const res = await step1.request('/', {}, {})
    expect(res.status).toBe(404)
  })
})

describe('9.3 ai.generate（prompt だけ）', () => {
  it('POST /generate', async () => {
    const { ai, calls } = fakeAi(() => textAnswer)
    const res = await generateAi.request(
      '/generate',
      jsonPost({ prompt: 'Hello' }),
      { AI: ai }
    )
    expect(await res.json()).toEqual(textAnswer)
    expect(calls[0].input).toEqual({ prompt: 'Hello' })
  })
})

describe('9.3 ai.chat-basic（messages 形式）', () => {
  it('system と user のメッセージ、max_tokens 512、temperature 0.7', async () => {
    const { ai, calls } = fakeAi(() => textAnswer)
    const res = await chatBasicAi.request('/chat', jsonPost({ message: 'カレー' }), {
      AI: ai
    })
    expect(await res.json()).toEqual(textAnswer)
    const input = calls[0].input as {
      messages: { role: string; content: string }[]
      max_tokens: number
      temperature: number
    }
    expect(input.messages.map((m) => m.role)).toEqual(['system', 'user'])
    expect(input.messages[0].content).toBe(
      'あなたは料理のレシピを提案するアシスタントです。簡潔に回答してください。'
    )
    expect(input.messages[1].content).toBe('カレー')
    expect(input.max_tokens).toBe(512)
    expect(input.temperature).toBe(0.7)
  })
})

describe('9.5 ai.r2（画像を R2 に保存）', () => {
  it('POST /image/save', async () => {
    const bytes = [9, 8, 7]
    const { ai } = fakeAi(() => ({ image: toBase64(bytes) }))
    const { bucket, objects } = fakeR2()
    const res = await r2Ai.request('/image/save', jsonPost({ prompt: 'x' }), {
      AI: ai,
      IMAGES_BUCKET: bucket
    })
    const body = await res.json<{ key: string; message: string }>()
    expect(body.message).toBe('画像を生成して R2 に保存しました')
    expect([...(objects.get(body.key)?.bytes ?? [])]).toEqual(bytes)
  })
})

describe('9.6 ai.vectorize', () => {
  it('POST /index と POST /search', async () => {
    const { ai } = fakeAi(() => ({ data: [[1, 0]] }))
    const matches = [{ id: 'a', score: 1 }]
    const { index, upserts, queries } = fakeVectorize(matches)
    const env = { AI: ai, VECTOR_INDEX: index }

    const indexed = await vectorizeAi.request(
      '/index',
      jsonPost({ id: 'a', text: 't' }),
      env
    )
    expect(await indexed.json()).toEqual({ id: 'a', indexed: true })
    expect(upserts).toEqual([[{ id: 'a', values: [1, 0] }]])

    const found = await vectorizeAi.request(
      '/search',
      jsonPost({ query: 'q' }),
      env
    )
    expect(await found.json()).toEqual({ query: 'q', matches })
    expect(queries[0].options).toEqual({ topK: 5 })
  })
})

describe('9.9 ai.kv（KV キャッシュ）', () => {
  it('POST /cached-chat: 2 回目は KV から返る', async () => {
    const { ai, calls } = fakeAi(() => textAnswer)
    const { kv } = fakeKV()
    const env = { AI: ai, AI_CACHE: kv }
    const first = await kvAi.request('/cached-chat', jsonPost({ message: 'm' }), env)
    const second = await kvAi.request('/cached-chat', jsonPost({ message: 'm' }), env)
    expect(await first.json()).toEqual({ response: 'こんにちは', cached: false })
    expect(await second.json()).toEqual({ response: 'こんにちは', cached: true })
    expect(calls).toHaveLength(1)
  })
})

describe('9.7 ai.modular（/text と /image）', () => {
  it('POST /text（エラーハンドリングなしの版）', async () => {
    const { ai, calls } = fakeAi(() => textAnswer)
    const res = await modularAi.request('/text', jsonPost({ message: 'hi' }), {
      AI: ai
    })
    expect(await res.json()).toEqual(textAnswer)
    expect(calls[0].input.max_tokens).toBe(512)
  })

  it('POST /image', async () => {
    const bytes = [5, 6, 7, 255]
    const { ai } = fakeAi(() => ({ image: toBase64(bytes) }))
    const res = await modularAi.request('/image', jsonPost({ prompt: 'p' }), {
      AI: ai
    })
    expect(res.headers.get('content-type')).toBe('image/jpeg')
    expect([...new Uint8Array(await res.arrayBuffer())]).toEqual(bytes)
  })
})
