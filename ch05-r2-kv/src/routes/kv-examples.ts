// src/routes/kv-examples.ts
import { Hono } from 'hono'

type Bindings = {
  MY_KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.post('/examples/kv-put', async (c) => {
  // #region put
  // 文字列を保存
  await c.env.MY_KV.put('config:site-name', 'My Blog')

  // JSON を保存 (文字列化が必要)
  await c.env.MY_KV.put('config:settings', JSON.stringify({
    postsPerPage: 10,
    theme: 'dark',
  }))

  // 有効期限付き (TTL 秒指定)
  await c.env.MY_KV.put('session:abc123', JSON.stringify({ userId: 'user-1' }), {
    expirationTtl: 3600, // 1 時間後に自動削除
  })

  // UNIX タイムスタンプで有効期限を指定
  await c.env.MY_KV.put('token:xyz', 'refresh-token-value', {
    expiration: Math.floor(Date.now() / 1000) + 86400, // 24 時間後
  })
  // #endregion
  return c.body(null, 204)
})

app.post('/examples/kv-put-metadata', async (c) => {
  // #region put-metadata
  const articleBody = JSON.stringify({ title: 'Draft', body: 'Hello' })

  await c.env.MY_KV.put('article:draft-1', articleBody, {
    metadata: {
      author: 'makino',
      createdAt: new Date().toISOString(),
      tags: ['hono', 'workers'],
    },
  })
  // #endregion
  return c.body(null, 204)
})

app.get('/examples/kv-get', async (c) => {
  // #region get
  // 文字列として取得 (デフォルト)
  const name = await c.env.MY_KV.get('config:site-name')

  // JSON として取得 (自動パース)
  const settings = await c.env.MY_KV.get('config:settings', 'json')

  // ArrayBuffer として取得
  const binary = await c.env.MY_KV.get('file:small-icon', 'arrayBuffer')

  // ReadableStream として取得
  const stream = await c.env.MY_KV.get('file:large-data', 'stream')
  // #endregion
  return c.json({
    name,
    settings,
    binary: binary?.byteLength ?? null,
    stream: stream !== null,
  })
})

app.get('/examples/kv-get-with-metadata', async (c) => {
  // #region get-with-metadata
  const { value, metadata } = await c.env.MY_KV.getWithMetadata<
    unknown,
    { author: string; createdAt: string }
  >('article:draft-1', 'json')

  if (value && metadata) {
    console.log(metadata.author)    // 'makino'
    console.log(metadata.createdAt) // '2026-05-27T...'
  }
  // #endregion
  return c.json({ value, metadata })
})

app.delete('/examples/kv-delete', async (c) => {
  // #region delete
  await c.env.MY_KV.delete('session:abc123')
  // #endregion
  return c.body(null, 204)
})

app.get('/examples/kv-list', async (c) => {
  // #region list
  const listed = await c.env.MY_KV.list({
    prefix: 'article:',
    limit: 50,
  })

  for (const key of listed.keys) {
    console.log(key.name, key.metadata, key.expiration)
  }

  // ページネーション
  if (!listed.list_complete) {
    const next = await c.env.MY_KV.list({
      prefix: 'article:',
      limit: 50,
      cursor: listed.cursor,
    })
  }
  // #endregion
  return c.json({ keys: listed.keys.map((key) => key.name) })
})

export default app
