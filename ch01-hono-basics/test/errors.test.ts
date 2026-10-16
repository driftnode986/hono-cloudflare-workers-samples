import { beforeAll, describe, expect, it, vi } from 'vitest'
import errors from '../src/errors'
import httpException from '../src/http-exception'

beforeAll(() => {
  // errors.ts has no throwing route; add one before the first request
  errors.get('/boom', () => {
    throw new Error('boom')
  })
})

describe('error handling (1.6)', () => {
  it('notFound returns a JSON 404 with the URL', async () => {
    const res = await errors.request('/missing')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({
      error: 'Not Found',
      path: 'http://localhost/missing',
    })
  })

  it('onError turns a thrown Error into a JSON 500', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await errors.request('/boom')
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Internal Server Error' })
    expect(spy).toHaveBeenCalledWith('Unhandled error: boom')
  })

  it('HTTPException becomes its own response', async () => {
    const denied = await httpException.request('/admin')
    expect(denied.status).toBe(401)
    expect(await denied.text()).toBe('Token is required')
    const ok = await httpException.request('/admin', {
      headers: { Authorization: 'Bearer x' },
    })
    expect(ok.status).toBe(200)
    expect(await ok.text()).toBe('Admin page')
  })
})
