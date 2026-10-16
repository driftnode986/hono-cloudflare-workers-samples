// #region service-worker
// src/index.ts (Service Worker 形式)
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request: Request): Promise<Response> {
  return new Response('Hello World')
}
// #endregion

// この形式は ES Modules ではないが、テストから import できるよう
// ファイルをモジュールとして扱わせる
export {}
