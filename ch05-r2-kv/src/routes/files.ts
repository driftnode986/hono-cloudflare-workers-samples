// src/routes/files.ts
import { Hono } from 'hono'

type Bindings = {
  FILES_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.put('/files/:key', async (c) => {
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
// src/routes/files.ts
app.head('/files/:key', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.FILES_BUCKET.head(key)

  if (!object) {
    return c.notFound()
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('content-length', String(object.size))

  return new Response(null, { headers })
})
// src/routes/files.ts
app.delete('/files/:key', async (c) => {
  const key = c.req.param('key')
  await c.env.FILES_BUCKET.delete(key)
  return c.body(null, 204)
})
// src/routes/files.ts
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
// src/routes/files.ts
app.get('/files/:key', async (c) => {
  const key = c.req.param('key')
  const ifNoneMatch = c.req.header('If-None-Match')

  const object = await c.env.FILES_BUCKET.get(key, {
    onlyIf: {
      etagDoesNotMatch: ifNoneMatch || undefined,
    },
  })

  if (!object) {
    return c.json({ error: 'File not found' }, 404)
  }

  if (object instanceof R2ObjectBody === false) {
    return new Response(null, { status: 304 })
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('cache-control', 'public, max-age=86400')

  return new Response(object.body, { headers })
})
