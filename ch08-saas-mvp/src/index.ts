// src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { tenantAuth } from './middleware/tenant'
import { quotaCheck } from './middleware/quota'
import apiKeysApp from './routes/api-keys'
import resourcesApp from './routes/resources'
import queueHandler from './queue'
import type { Bindings, Variables } from './types'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('*', cors())

app.use('/api/*', tenantAuth)
app.use('/api/*', quotaCheck)

app.route('/api/keys', apiKeysApp)
app.route('/api/resources', resourcesApp)

app.get('/health', (c) => c.json({ status: 'ok' }))

export default {
  fetch: app.fetch,
  queue: queueHandler.queue,
}
