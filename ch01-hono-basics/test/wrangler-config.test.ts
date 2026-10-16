import { describe, expect, it } from 'vitest'
import { unstable_readConfig } from 'wrangler'

describe('wrangler.toml (1.2)', () => {
  it('is valid for Wrangler and matches the book', () => {
    const config = unstable_readConfig({ config: 'wrangler.toml' })
    expect(config.name).toBe('my-hono-app')
    expect(config.compatibility_date).toBe('2026-05-27')
    expect(config.main).toMatch(/src\/index\.ts$/)
  })
})
