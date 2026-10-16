// src/routes/ai.ts
import { Hono } from 'hono'
import { embed } from '../lib/embed'
import { decodeImage } from '../lib/image'
import { sha256Hex } from '../lib/hash'

type Bindings = {
  AI: Ai
  IMAGES_BUCKET: R2Bucket
  VECTOR_INDEX: Vectorize
  AI_CACHE: KVNamespace
}

const ai = new Hono<{ Bindings: Bindings }>()

ai.post('/generate', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>()

  const result = await c.env.AI.run(
    '@cf/meta/llama-3.1-8b-instruct',
    { prompt }
  )

  return c.json(result)
})

// #region stream
ai.post('/stream', async (c) => {
  const { message } = await c.req.json<{ message: string }>()

  const stream = await c.env.AI.run(
    '@cf/meta/llama-3.1-8b-instruct',
    {
      messages: [
        { role: 'system', content: 'あなたは親切なアシスタントです。' },
        { role: 'user', content: message }
      ],
      stream: true
    }
  )

  return new Response(stream, {
    headers: { 'content-type': 'text/event-stream' }
  })
})
// #endregion

// #region image
ai.post('/image', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>()

  const result = await c.env.AI.run(
    '@cf/black-forest-labs/flux-1-schnell',
    { prompt }
  )

  return new Response(decodeImage(result), {
    headers: { 'content-type': 'image/jpeg' }
  })
})
// #endregion

// #region image-save
ai.post('/image/save', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>()

  const imageData = await c.env.AI.run(
    '@cf/black-forest-labs/flux-1-schnell',
    { prompt }
  )

  const key = `generated/${Date.now()}.jpg`
  await c.env.IMAGES_BUCKET.put(key, decodeImage(imageData), {
    httpMetadata: { contentType: 'image/jpeg' }
  })

  return c.json({ key, message: '画像を生成して R2 に保存しました' })
})
// #endregion

// #region embed
ai.post('/embed', async (c) => {
  const { text } = await c.req.json<{ text: string }>()

  const [vector] = await embed(c.env.AI, [text])

  return c.json({ vector, dimensions: vector.length })
})
// #endregion

// #region similarity
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

ai.post('/similarity', async (c) => {
  const { text1, text2 } = await c.req.json<{
    text1: string
    text2: string
  }>()

  const [v1, v2] = await embed(c.env.AI, [text1, text2])

  const similarity = cosineSimilarity(v1, v2)

  return c.json({ text1, text2, similarity })
})
// #endregion

// #region index-doc
ai.post('/index', async (c) => {
  const { id, text } = await c.req.json<{ id: string; text: string }>()

  const [values] = await embed(c.env.AI, [text])

  await c.env.VECTOR_INDEX.upsert([{ id, values }])

  return c.json({ id, indexed: true })
})
// #endregion

// #region search
ai.post('/search', async (c) => {
  const { query } = await c.req.json<{ query: string }>()

  const [vector] = await embed(c.env.AI, [query])

  const matches = await c.env.VECTOR_INDEX.query(vector, { topK: 5 })

  return c.json({ query, matches: matches.matches })
})
// #endregion

// #region text-safe
ai.post('/text', async (c) => {
  const { message } = await c.req.json<{ message: string }>()

  try {
    const result = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'あなたは親切なアシスタントです。' },
        { role: 'user', content: message }
      ],
      max_tokens: 512
    })
    return c.json(result)
  } catch (error) {
    if (error instanceof Error) {
      return c.json(
        { error: 'AI inference failed', detail: error.message },
        500
      )
    }
    return c.json({ error: 'Unknown error' }, 500)
  }
})
// #endregion

// #region chat-zod
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  maxTokens: z.number().int().min(64).max(2048).optional()
})

ai.post(
  '/chat',
  zValidator('json', chatSchema),
  async (c) => {
    const { message, maxTokens } = c.req.valid('json')
    const result = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'あなたは親切なアシスタントです。' },
        { role: 'user', content: message }
      ],
      max_tokens: maxTokens ?? 512
    })
    return c.json(result)
  }
)
// #endregion

ai.post('/gateway-chat', async (c) => {
  // #region gateway
  const result = await c.env.AI.run(
    '@cf/meta/llama-3.1-8b-instruct',
    { messages: [{ role: 'user', content: 'Hello' }] },
    { gateway: { id: 'my-ai-gateway' } }
  )
  // #endregion
  return c.json(result)
})

// #region cached-chat
ai.post('/cached-chat', async (c) => {
  const { message } = await c.req.json<{ message: string }>()

  const cacheKey = `ai:${await sha256Hex(message)}`
  const cached = await c.env.AI_CACHE.get(cacheKey)
  if (cached) {
    return c.json({ response: cached, cached: true })
  }

  const result = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: 'あなたは親切なアシスタントです。' },
      { role: 'user', content: message }
    ],
    max_tokens: 512
  })

  await c.env.AI_CACHE.put(cacheKey, result.response ?? '', {
    expirationTtl: 3600
  })

  return c.json({ response: result.response ?? '', cached: false })
})
// #endregion

export { ai }
