// src/routes/posts.ts
import { Hono } from 'hono'
import type { AppEnv } from '../types'

const postsApp = new Hono<AppEnv>()

postsApp.get('/', (c) => c.json({ posts: [] }))
postsApp.post('/', (c) => c.json({ id: '1' }, 201))

export default postsApp
