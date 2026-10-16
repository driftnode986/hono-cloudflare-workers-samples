// src/index.ts
import { Hono } from 'hono'
import { ai } from './routes/ai'

type Bindings = {
  AI: Ai
  IMAGES_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.route('/ai', ai)

export default app
