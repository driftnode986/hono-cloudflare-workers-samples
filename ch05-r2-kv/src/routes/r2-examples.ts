// src/routes/r2-examples.ts
import { Hono } from 'hono'

type Bindings = {
  FILES_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.post('/examples/r2-delete-many', async (c) => {
  // #region delete-many
  await c.env.FILES_BUCKET.delete(['image-1.png', 'image-2.png', 'image-3.png'])
  // #endregion
  return c.body(null, 204)
})

export default app
