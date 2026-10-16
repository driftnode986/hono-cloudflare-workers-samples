import { describe, expect, it } from 'vitest'
import envTypes from '../src/env-types'
import app from '../src/index'
import users from '../src/routes/users'
import { factory } from '../src/factory'

describe('TypeScript integration (1.7)', () => {
  it('Bindings and Variables are usable from handlers', async () => {
    const res = await envTypes.request('/', {}, { SECRET_KEY: 's' })
    expect(await res.json()).toEqual({ user: { id: '1', name: 'Alice' } })
  })

  it('createFactory shares one Env between app and middleware', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const { requestId } = await res.json<{ requestId: string }>()
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/)
    const again = await app.request('/')
    const second = await again.json<{ requestId: string }>()
    expect(second.requestId).not.toBe(requestId)
  })

  it('exports the factory and the users sub app', async () => {
    expect(typeof factory.createApp).toBe('function')
    const res = await users.request('/1')
    expect(await res.json()).toEqual({ id: '1' })
  })
})
