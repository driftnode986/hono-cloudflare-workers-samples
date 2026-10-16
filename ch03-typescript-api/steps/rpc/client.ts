// #region client-basic
// client.ts
import { hc } from 'hono/client'
import type { AppType } from './src/index'

const client = hc<AppType>('http://localhost:8787')

async function main() {
  // GET /api/posts
  const listRes = await client.api.posts.$get()
  const { posts } = await listRes.json()
  // posts: { id: string; title: string; body: string }[]

  // POST /api/posts
  const createRes = await client.api.posts.$post({
    json: { title: 'New Post', body: 'Content' },
  })
  const created = await createRes.json()
  // created: { id: string; title: string; body: string }

  // GET /api/posts/:id
  const getRes = await client.api.posts[':id'].$get({
    param: { id: '1' },
  })
  const post = await getRes.json()
  // post: { id: string; title: string; body: string }
}
// #endregion

// #region client-infer
// client.ts
import type { InferRequestType, InferResponseType } from 'hono/client'

type CreatePostRequest = InferRequestType<typeof client.api.posts.$post>['json']
// { title: string; body: string }

type CreatePostResponse = InferResponseType<typeof client.api.posts.$post>
// { id: string; title: string; body: string }
// #endregion

// 型検査のためだけに使う（呼び出しはテスト側で行う）
export { main }
export type { CreatePostRequest, CreatePostResponse }
