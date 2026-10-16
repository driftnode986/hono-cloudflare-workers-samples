import { Hono } from 'hono'

const app = new Hono()

// #region path-params
// src/index.ts
// 単一パラメータ
app.get('/users/:name', (c) => {
  const name = c.req.param('name')
  return c.text(`Hello ${name}`)
})

// 複数パラメータ (オブジェクトで一括取得)
app.get('/posts/:id/comments/:commentId', (c) => {
  const { id, commentId } = c.req.param()
  return c.json({ postId: id, commentId })
})

// オプショナルパラメータ
app.get('/api/animals/:type?', (c) => {
  const type = c.req.param('type') ?? 'all'
  return c.text(`Type: ${type}`)
})
// #endregion

// #region query-params
// src/index.ts
app.get('/search', (c) => {
  const q = c.req.query('q')          // string | undefined
  return c.json({ query: q })
})

app.get('/filter', (c) => {
  const tags = c.req.queries('tag')   // string[] | undefined
  return c.json({ tags })
})
// GET /filter?tag=hono&tag=workers => { tags: ["hono", "workers"] }
// #endregion

// #region wildcard
// src/index.ts
app.get('/files/*', (c) => {
  return c.text('Matched a file route')
})
// #endregion

export default app
