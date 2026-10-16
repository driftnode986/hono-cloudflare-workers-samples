// #region list-route
// src/openapi-routes/posts.ts
import { createRoute } from '@hono/zod-openapi'
import { PostIdParam, PostSchema, CreatePostBody } from '../schemas/post'
import { z } from '@hono/zod-openapi'

export const listPostsRoute = createRoute({
  method: 'get',
  path: '/api/posts',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ posts: z.array(PostSchema) }),
        },
      },
      description: '記事一覧を取得',
    },
  },
})
// #endregion

// #region create-route
export const createPostRoute = createRoute({
  method: 'post',
  path: '/api/posts',
  request: {
    body: {
      content: {
        'application/json': { schema: CreatePostBody },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': { schema: PostSchema },
      },
      description: '記事を作成',
    },
  },
})
// #endregion

// #region get-route
export const getPostRoute = createRoute({
  method: 'get',
  path: '/api/posts/{id}',
  request: { params: PostIdParam },
  responses: {
    200: {
      content: {
        'application/json': { schema: PostSchema },
      },
      description: '指定 ID の記事を取得',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
      description: '記事が見つからない',
    },
  },
})
// #endregion
