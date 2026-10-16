import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
  CACHE: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/users/:id', async (c) => {
  const userId = c.req.param('id')
  // #region d1-query
  // src/index.ts
  const results = await c.env.DB
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .all()
  // #endregion
  return c.json(results.results)
})

app.put('/photo', async (c) => {
  const imageData = await c.req.arrayBuffer()
  // #region r2-get-put
  // src/index.ts
  // ファイルの取得
  const object = await c.env.BUCKET.get('images/photo.jpg')

  // ファイルの保存
  await c.env.BUCKET.put('images/photo.jpg', imageData)
  // #endregion
  return c.json({ replaced: object !== null })
})

app.post('/session', async (c) => {
  const data = await c.req.json()
  // #region kv-get-put
  // src/index.ts
  // 値の読み取り
  const value = await c.env.CACHE.get('session:abc123')

  // 値の書き込み (TTL 3600 秒)
  await c.env.CACHE.put('session:abc123', JSON.stringify(data), {
    expirationTtl: 3600,
  })
  // #endregion
  return c.json({ previous: value })
})

export default app
