// src/routes/files.ts (5.3 の時点。条件付きリクエストを入れる前の GET)
import { Hono } from 'hono'

type Bindings = {
  FILES_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// #region get
app.get('/files/:key{.+}', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.FILES_BUCKET.get(key)

  if (!object) {
    return c.json({ error: 'File not found' }, 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)

  return new Response(object.body, { headers })
})
// #endregion

export default app
