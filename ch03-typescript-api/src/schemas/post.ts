// src/schemas/post.ts
import { z } from '@hono/zod-openapi'

export const PostIdParam = z.object({
  id: z.string().uuid().openapi({
    param: { name: 'id', in: 'path' },
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
})

export const PostSchema = z.object({
  id: z.string().uuid().openapi({
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
  title: z.string().openapi({ example: 'Hono入門' }),
  body: z.string().openapi({ example: '本文の内容です' }),
  createdAt: z.string().datetime().openapi({
    example: '2026-05-01T00:00:00Z',
  }),
}).openapi('Post')

export const CreatePostBody = z.object({
  title: z.string().min(1).max(100).openapi({ example: 'Hono入門' }),
  body: z.string().min(1).openapi({ example: '本文の内容です' }),
}).openapi('CreatePostBody')
