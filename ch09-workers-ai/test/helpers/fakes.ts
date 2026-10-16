// Workers のバインディングの代わりに使う、テスト用の簡単な偽物。
// Workers AI は実物がローカルで動かない（実際の Cloudflare API を呼ぶ）ため偽物を使う。

type AiCall = {
  model: string
  input: Record<string, unknown>
  options?: Record<string, unknown>
}

export function fakeAi(
  respond: (call: AiCall) => unknown | Promise<unknown>
) {
  const calls: AiCall[] = []
  const ai = {
    run: async (
      model: string,
      input: Record<string, unknown>,
      options?: Record<string, unknown>
    ) => {
      const call = { model, input, options }
      calls.push(call)
      return respond(call)
    }
  }
  return { ai: ai as unknown as Ai, calls }
}

export function fakeKV() {
  const store = new Map<string, { value: string; ttl?: number }>()
  const kv = {
    get: async (key: string) => store.get(key)?.value ?? null,
    put: async (
      key: string,
      value: string,
      options?: { expirationTtl?: number }
    ) => {
      store.set(key, { value, ttl: options?.expirationTtl })
    }
  }
  return { kv: kv as unknown as KVNamespace, store }
}

export function fakeR2() {
  const objects = new Map<
    string,
    { bytes: Uint8Array; contentType?: string }
  >()
  const bucket = {
    put: async (
      key: string,
      value: ArrayBufferView,
      options?: { httpMetadata?: { contentType?: string } }
    ) => {
      const view = value as Uint8Array
      objects.set(key, {
        bytes: new Uint8Array(view),
        contentType: options?.httpMetadata?.contentType
      })
    }
  }
  return { bucket: bucket as unknown as R2Bucket, objects }
}

export function fakeVectorize(matches: { id: string; score: number }[] = []) {
  const upserts: { id: string; values: number[] }[][] = []
  const queries: { vector: number[]; options: unknown }[] = []
  const index = {
    upsert: async (vectors: { id: string; values: number[] }[]) => {
      upserts.push(vectors)
      return { mutationId: 'm-1' }
    },
    query: async (vector: number[], options: unknown) => {
      queries.push({ vector, options })
      return { count: matches.length, matches }
    }
  }
  return { index: index as unknown as Vectorize, upserts, queries }
}

export function toBase64(bytes: number[]): string {
  return btoa(String.fromCharCode(...bytes))
}

export function jsonPost(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }
}
