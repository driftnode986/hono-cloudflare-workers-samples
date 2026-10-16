// src/index.ts
import { Hono } from 'hono'
import type { AppEnv } from './types'

const app = new Hono<AppEnv>()
