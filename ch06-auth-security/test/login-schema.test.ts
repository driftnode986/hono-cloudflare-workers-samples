// test/login-schema.test.ts
import { describe, it, expect } from 'vitest'
import schemaApp from '../src/examples/login-schema'
import { call } from './helpers'

const post = (body: unknown) =>
  call(schemaApp, '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('login schema with length limits (6.8)', () => {
  it('accepts a normal login', async () => {
    const res = await post({ email: 'a@example.com', password: 'longenough' })
    expect(res.status).toBe(200)
  })

  it('rejects a password over 128 characters', async () => {
    const res = await post({ email: 'a@example.com', password: 'x'.repeat(129) })
    expect(res.status).toBe(400)
  })

  it('rejects an email over 254 characters', async () => {
    const res = await post({ email: `${'a'.repeat(250)}@example.com`, password: 'longenough' })
    expect(res.status).toBe(400)
  })
})
