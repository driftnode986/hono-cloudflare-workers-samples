import { afterEach, describe, expect, it, vi } from 'vitest'
import hello from '../src/index'
import moduleWorker from '../src/module-worker'
import envBindings from '../src/env-bindings'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('first Worker (2.6)', () => {
  it('GET / returns Hello Hono!', async () => {
    const res = await hello.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Hello Hono!')
  })
})

describe('Worker formats (2.1)', () => {
  it('ES Modules form answers through export default fetch', async () => {
    const ctx = {
      waitUntil() {},
      passThroughOnException() {},
    } as unknown as ExecutionContext
    const res = await moduleWorker.fetch(
      new Request('http://localhost/'),
      {},
      ctx,
    )
    expect(await res.text()).toBe('Hello World')
  })

  it('Service Worker form registers a fetch listener', async () => {
    const listeners: Record<string, (event: unknown) => void> = {}
    vi.stubGlobal('addEventListener', (type: string, fn: never) => {
      listeners[type] = fn
    })
    await import('../src/service-worker')
    expect(Object.keys(listeners)).toEqual(['fetch'])

    let responded: Promise<Response> | undefined
    listeners.fetch({
      request: new Request('http://localhost/'),
      respondWith: (p: Promise<Response>) => {
        responded = p
      },
    })
    expect(await (await responded)!.text()).toBe('Hello World')
  })
})

describe('Bindings type (2.5)', () => {
  it('reads a variable from c.env', async () => {
    const res = await envBindings.request(
      '/',
      {},
      { API_HOST: 'api.example.com' },
    )
    expect(await res.json()).toEqual({ host: 'api.example.com' })
  })
})
