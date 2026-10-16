// src/routes/ai.ts
import { Hono } from 'hono'

type Bindings = {
  AI: Ai
  IMAGES_BUCKET: R2Bucket
}

const ai = new Hono<{ Bindings: Bindings }>()

ai.post('/text', async (c) => {
  const { message } = await c.req.json<{ message: string }>()
  const result = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: 'あなたは親切なアシスタントです。' },
      { role: 'user', content: message }
    ],
    max_tokens: 512
  })
  return c.json(result)
})

ai.post('/image', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>()
  const result = await c.env.AI.run(
    '@cf/black-forest-labs/flux-1-schnell',
    { prompt }
  )
  return new Response(result, {
    headers: { 'content-type': 'image/png' }
  })
})

export { ai }
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
