// src/index.ts
import { Hono } from 'hono'
import { timing } from './middleware/timing'

const app = new Hono()

app.use(timing)

app.get('/', (c) => c.text('Hello!'))

export default app
