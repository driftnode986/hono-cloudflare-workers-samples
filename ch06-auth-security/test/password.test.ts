// test/password.test.ts
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../src/lib/password'

describe('password hashing', () => {
  it('stores salt and hash as 32 and 64 hex characters', async () => {
    const stored = await hashPassword('correct horse')
    expect(stored).toMatch(/^[0-9a-f]{32}:[0-9a-f]{64}$/)
  })

  it('verifies the right password and rejects a wrong one', async () => {
    const stored = await hashPassword('correct horse')
    expect(await verifyPassword('correct horse', stored)).toBe(true)
    expect(await verifyPassword('wrong horse!', stored)).toBe(false)
  })

  it('uses a fresh salt for every hash', async () => {
    const a = await hashPassword('same password')
    const b = await hashPassword('same password')
    expect(a).not.toBe(b)
    expect(await verifyPassword('same password', a)).toBe(true)
    expect(await verifyPassword('same password', b)).toBe(true)
  })

  it('rejects a stored hash of the wrong length without throwing', async () => {
    const stored = await hashPassword('correct horse')
    const [salt, hash] = stored.split(':')
    expect(await verifyPassword('correct horse', `${salt}:${hash.slice(2)}`)).toBe(false)
  })

  it('uses 100,000 PBKDF2 iterations, the limit in production Workers', async () => {
    const src = (await import('../src/lib/password.ts?raw')).default
    const counts = [...src.matchAll(/iterations:\s*([\d_]+)/g)].map((m) =>
      Number(m[1].replace(/_/g, ''))
    )
    expect(counts.length).toBeGreaterThan(0)
    for (const n of counts) expect(n).toBeLessThanOrEqual(100000)
  })
})
