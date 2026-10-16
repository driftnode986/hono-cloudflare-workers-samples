import { Hono } from 'hono'

type Bindings = {
  AI: Ai
}

const ai = new Hono<{ Bindings: Bindings }>()

// #region chat-basic
ai.post('/chat', async (c) => {
  const { message } = await c.req.json<{ message: string }>()

  const result = await c.env.AI.run(
    '@cf/meta/llama-3.1-8b-instruct',
    {
      messages: [
        {
          role: 'system',
          content: 'あなたは料理のレシピを提案するアシスタントです。' +
            '簡潔に回答してください。'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 512,
      temperature: 0.7
    }
  )

  return c.json(result)
})
// #endregion

export { ai }
