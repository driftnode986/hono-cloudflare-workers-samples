import { Hono } from 'hono'
import { decodeImage } from '../lib/image'

// #region r2-save
type Bindings = {
  AI: Ai
  IMAGES_BUCKET: R2Bucket
}

const ai = new Hono<{ Bindings: Bindings }>()

ai.post('/image/save', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>()

  const imageData = await c.env.AI.run(
    '@cf/black-forest-labs/flux-1-schnell',
    { prompt }
  )

  const key = `generated/${Date.now()}.jpg`
  await c.env.IMAGES_BUCKET.put(key, decodeImage(imageData), {
    httpMetadata: { contentType: 'image/jpeg' }
  })

  return c.json({ key, message: '画像を生成して R2 に保存しました' })
})
// #endregion

export { ai }
