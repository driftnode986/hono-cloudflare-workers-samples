import { hc } from 'hono/client'
import type { AppType } from './src/index'

const client = hc<AppType>('http://localhost:8787')

export async function fetchPost(id: string) {
// #region client-status
// client.ts (クライアント側)
const res = await client.api.posts[':id'].$get({ param: { id: '999' } })

if (res.status === 404) {
  const data = await res.json()
  // data: { error: string }
} else {
  const data = await res.json()
  // data: { post: { id: string; title: string; body: string } }
}
// #endregion
}
