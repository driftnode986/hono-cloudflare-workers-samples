// src/routes/ai.ts
import { Hono } from 'hono'

type Bindings = {
  AI: Ai
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

export { ai }
