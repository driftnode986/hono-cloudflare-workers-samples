// #region modular-text
// src/routes/ai.ts
import { Hono } from 'hono'
import { decodeImage } from '../lib/image'

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
// #endregion

// #region modular-image
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

export { ai }
// #endregion
