// src/index.ts (ES Modules 形式)
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return new Response('Hello World')
  },
}
