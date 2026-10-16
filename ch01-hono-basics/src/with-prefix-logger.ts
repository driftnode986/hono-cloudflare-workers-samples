import { Hono } from 'hono'
import { prefixLogger } from './middleware/prefix-logger'

const app = new Hono()

// #region use-prefix-logger
// src/index.ts
app.use(prefixLogger('APP'))
// #endregion

app.get('/', (c) => c.text('Hello!'))

export default app
