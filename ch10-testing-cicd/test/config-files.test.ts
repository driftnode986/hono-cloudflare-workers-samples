// 本文に載せる設定ファイルが、読める形で、本文の説明どおりの中身であることを確かめる。
import { describe, it, expect } from 'vitest'
import { parse as parseToml } from 'smol-toml'
import { parse as parseYaml } from 'yaml'
import wranglerToml from '../wrangler.toml?raw'
import compatDateToml from '../steps/compat-date.toml?raw'
import workflowYml from '../.github/workflows/deploy.yml?raw'
import typesTs from '../src/types.ts?raw'

type Config = Record<string, any>

describe('wrangler.toml', () => {
  const config = parseToml(wranglerToml) as Config

  it('Worker の基本設定', () => {
    expect(config.name).toBe('saas-api')
    expect(config.main).toBe('src/index.ts')
    expect(config.compatibility_date).toBe('2026-01-01')
    expect(config.vars).toEqual({ ENVIRONMENT: 'development' })
  })

  it.each(['staging', 'production'])(
    '%s は DB と PLAN_KV を自分で定義する（環境間で継承されない）',
    (name) => {
      const env = config.env[name]
      expect(env.vars.ENVIRONMENT).toBe(name)
      expect(env.d1_databases[0].binding).toBe('DB')
      expect(env.d1_databases[0].database_name).toBe(`saas-db-${name}`)
      expect(env.kv_namespaces[0].binding).toBe('PLAN_KV')
    }
  )

  it('テストと開発で使う既定の環境のバインディング', () => {
    expect(config.d1_databases[0].binding).toBe('DB')
    expect(config.kv_namespaces[0].binding).toBe('PLAN_KV')
    expect(config.queues.producers[0].binding).toBe('JOB_QUEUE')
  })

  it('Workers Logs とカスタムドメイン', () => {
    expect(config.observability).toEqual({ enabled: true })
    expect(config.routes).toEqual([
      { pattern: 'api.example.com', custom_domain: true },
    ])
  })
})

describe('steps/compat-date.toml', () => {
  it('compatibility_date が wrangler.toml と同じ', () => {
    const config = parseToml(compatDateToml) as Config
    expect(config.compatibility_date).toBe(
      (parseToml(wranglerToml) as Config).compatibility_date
    )
  })
})

describe('.github/workflows/deploy.yml', () => {
  const workflow = parseYaml(workflowYml) as Config

  it('main への push と PR で動く', () => {
    expect(workflow.on.push.branches).toEqual(['main'])
    expect(workflow.on.pull_request.branches).toEqual(['main'])
  })

  it('test が成功したときだけ、main で deploy する', () => {
    expect(workflow.jobs.deploy.needs).toBe('test')
    expect(workflow.jobs.deploy.if).toBe("github.ref == 'refs/heads/main'")
    const commands = workflow.jobs.test.steps.map((s: Config) => s.run)
    expect(commands).toContain('npm ci')
    expect(commands).toContain('npx vitest run')
  })

  it('deploy は npm ci で入れた手元の版の Wrangler を使う', () => {
    const steps = workflow.jobs.deploy.steps as Config[]
    const ci = steps.findIndex((s) => s.run === 'npm ci')
    const action = steps.findIndex((s) =>
      String(s.uses).startsWith('cloudflare/wrangler-action@')
    )
    expect(ci).toBeGreaterThan(-1)
    expect(ci).toBeLessThan(action)
  })

  it('デプロイにはシークレットを参照する（値を書かない）', () => {
    const wrangler = workflow.jobs.deploy.steps.find((s: Config) =>
      String(s.uses).startsWith('cloudflare/wrangler-action@')
    )
    expect(wrangler.uses).toBe('cloudflare/wrangler-action@v4')
    expect(wrangler.with.apiToken).toBe('${{ secrets.CLOUDFLARE_API_TOKEN }}')
    expect(wrangler.with.accountId).toBe('${{ secrets.CLOUDFLARE_ACCOUNT_ID }}')
  })
})

describe('src/types.ts', () => {
  it('第 8 章のアプリは秘密の値を Bindings に持たない（10.5）', () => {
    expect(typesTs).not.toMatch(/SECRET/)
  })
})
