// src/index.ts
import { Hono } from 'hono'
import type { AppEnv } from './types'
import postsApp from './routes/posts'

const app = new Hono<AppEnv>()

app.route('/api/posts', postsApp)

export default app
