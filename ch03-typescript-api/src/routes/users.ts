// src/routes/users.ts
import { Hono } from 'hono'
import type { AppEnv } from '../types'

const usersApp = new Hono<AppEnv>()

usersApp.get('/', (c) => c.json({ users: [] }))

export default usersApp
