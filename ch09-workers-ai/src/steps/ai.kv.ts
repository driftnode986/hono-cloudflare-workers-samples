import { Hono } from 'hono'

// #region kv-cache
type Bindings = {
  AI: Ai
  AI_CACHE: KVNamespace
}

const ai = new Hono<{ Bindings: Bindings }>()

ai.post('/cached-chat', async (c) => {
  const { message } = await c.req.json<{ message: string }>()

  const cacheKey = `ai:${message}`
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
