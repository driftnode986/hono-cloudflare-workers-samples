// src/index.ts
// #region app
import { Hono } from 'hono'
import type { AppEnv } from './types'

const app = new Hono<AppEnv>()
// #endregion

// #region mount
import files from './routes/files'
import images from './routes/images'
import auth from './routes/auth'
import posts from './routes/posts'
import config from './routes/config'
import kvExamples from './routes/kv-examples'
import r2Examples from './routes/r2-examples'

app.route('/', files)
app.route('/', images)
app.route('/', auth)
app.route('/', posts)
app.route('/', config)
app.route('/', kvExamples)
app.route('/', r2Examples)

export default app
// #endregion
