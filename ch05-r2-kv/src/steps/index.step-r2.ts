// src/index.ts (5.2 の時点。R2 のバインディングだけを持つ)
// #region bindings
import { Hono } from 'hono'

type Bindings = {
  FILES_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()
// #endregion

export default app
