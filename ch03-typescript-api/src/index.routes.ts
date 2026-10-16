// src/index.ts
import { Hono } from 'hono'
import type { AppEnv } from './types'
import postsApp from './routes/posts'
import usersApp from './routes/users'

const app = new Hono<AppEnv>()

const routes = app
  .route('/api/posts', postsApp)
  .route('/api/users', usersApp)

export type AppType = typeof routes

export default app
