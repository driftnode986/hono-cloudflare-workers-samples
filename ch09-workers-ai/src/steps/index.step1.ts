// #region setup
// src/index.ts
import { Hono } from 'hono'

type Bindings = {
  AI: Ai
}

const app = new Hono<{ Bindings: Bindings }>()
// #endregion

export default app
