// src/routes/config.ts
// #region app
import { Hono } from 'hono'

type Bindings = {
  MY_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()
// #endregion

app.get('/config', async (c) => {
  // #region read-many
  const keys = ['config:theme', 'config:locale', 'config:timezone']
  const results = await Promise.all(
    keys.map((key) => c.env.MY_KV.get(key, 'json'))
  )

  // results は (object | null)[] の配列
  keys.forEach((key, i) => {
    console.log(key, results[i])
  })
  // #endregion

  return c.json(Object.fromEntries(keys.map((key, i) => [key, results[i]])))
})

export default app
