// src/index.ts
import { factory } from './factory'
import { requestIdMiddleware } from './middleware/request-id'

const app = factory.createApp()

app.use(requestIdMiddleware)

app.get('/', (c) => {
  const id = c.get('requestId')  // string 型として推論
  return c.json({ requestId: id })
})

export default app
