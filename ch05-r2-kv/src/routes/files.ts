// src/routes/files.ts
// #region put
import { Hono } from 'hono'

type Bindings = {
  FILES_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.put('/files/:key{.+}', async (c) => {
  const key = c.req.param('key')
  const body = await c.req.arrayBuffer()
  const contentType = c.req.header('Content-Type') || 'application/octet-stream'

  const object = await c.env.FILES_BUCKET.put(key, body, {
    httpMetadata: {
      contentType,
    },
  })

  return c.json({
    key: object?.key,
    size: object?.size,
    etag: object?.etag,
  }, 201)
})

export default app
// #endregion

// #region head
app.get('/meta/:key{.+}', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.FILES_BUCKET.head(key)

  if (!object) {
    return c.notFound()
  }

  return c.json({
    key: object.key,
    size: object.size,
    etag: object.httpEtag,
    contentType: object.httpMetadata?.contentType,
  })
})
// #endregion

// #region delete
app.delete('/files/:key{.+}', async (c) => {
  const key = c.req.param('key')
  await c.env.FILES_BUCKET.delete(key)
  return c.body(null, 204)
})
// #endregion

// #region list
app.get('/files', async (c) => {
  const prefix = c.req.query('prefix') || ''
  const cursor = c.req.query('cursor')
  const limit = Number(c.req.query('limit') || '20')

  const listed = await c.env.FILES_BUCKET.list({
    prefix,
    limit,
    cursor: cursor || undefined,
  })

  return c.json({
    objects: listed.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded.toISOString(),
    })),
    truncated: listed.truncated,
    cursor: listed.truncated ? listed.cursor : undefined,
  })
})
// #endregion

// #region get-conditional
app.get('/files/:key{.+}', async (c) => {
  const key = c.req.param('key')
  // ブラウザは If-None-Match を "etag" と引用符つきで送る。R2 には外して渡す
  const ifNoneMatch = c.req.header('If-None-Match')?.replaceAll('"', '')

  const object = await c.env.FILES_BUCKET.get(key, {
    onlyIf: {
      etagDoesNotMatch: ifNoneMatch || undefined,
    },
  })

  if (!object) {
    return c.json({ error: 'File not found' }, 404)
  }

  if (!('body' in object)) {
    return new Response(null, { status: 304 })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('cache-control', 'public, max-age=86400')

  return new Response(object.body, { headers })
})
// #endregion
