// src/lib/find-post.ts
export type Post = { id: string; title: string; body: string }

const posts: Post[] = [
  { id: '1', title: 'Hello', body: 'World' },
]

export function findPost(id: string): Post | undefined {
  return posts.find((post) => post.id === id)
}
