import { Hono } from 'hono'
import { embed } from '../lib/embed'

// #region vectorize-setup-index
type Bindings = {
  AI: Ai
  VECTOR_INDEX: Vectorize
}

const ai = new Hono<{ Bindings: Bindings }>()

ai.post('/index', async (c) => {
  const { id, text } = await c.req.json<{ id: string; text: string }>()

  const [values] = await embed(c.env.AI, [text])

  await c.env.VECTOR_INDEX.upsert([{ id, values }])

  return c.json({ id, indexed: true })
})
// #endregion

// #region vectorize-search
ai.post('/search', async (c) => {
  const { query } = await c.req.json<{ query: string }>()

  const [vector] = await embed(c.env.AI, [query])

  const matches = await c.env.VECTOR_INDEX.query(vector, { topK: 5 })

  return c.json({ query, matches: matches.matches })
})
// #endregion

export { ai }
