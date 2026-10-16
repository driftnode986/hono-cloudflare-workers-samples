// src/routes/images.ts
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

type Bindings = {
  FILES_BUCKET: R2Bucket
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

const app = new Hono<{ Bindings: Bindings }>()

app.post('/images', async (c) => {
  const contentType = c.req.header('Content-Type')

  if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
    throw new HTTPException(415, {
      message: `Unsupported media type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
    })
  }

  const body = await c.req.arrayBuffer()

  if (body.byteLength > MAX_SIZE) {
    throw new HTTPException(413, {
      message: `File too large. Maximum size: ${MAX_SIZE / 1024 / 1024} MB`,
    })
  }

  const ext = contentType.split('/')[1].replace('jpeg', 'jpg')
  const key = `images/${crypto.randomUUID()}.${ext}`

  const object = await c.env.FILES_BUCKET.put(key, body, {
    httpMetadata: { contentType },
    customMetadata: {
      uploadedAt: new Date().toISOString(),
    },
  })

  return c.json({
    key: object?.key,
    size: object?.size,
    url: `/files/${key}`,
  }, 201)
})

export default app
