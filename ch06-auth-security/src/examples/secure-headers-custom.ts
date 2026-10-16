// src/examples/secure-headers-custom.ts (6.6 のカスタマイズ例)
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

const app = new Hono()

// #region custom
app.use(
  secureHeaders({
    xFrameOptions: false, // iframe 埋め込みを許可する場合
    strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
  })
)
// #endregion

app.get('/', (c) => c.text('ok'))

export default app
