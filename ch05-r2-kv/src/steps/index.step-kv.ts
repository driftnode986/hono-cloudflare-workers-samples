// src/index.ts (5.6 の時点。KV のバインディングだけを持つ)
import { Hono } from 'hono'

// #region bindings
type Bindings = {
  MY_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()
// #endregion

export default app
