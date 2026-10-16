# 第10章 テスト・CI/CD・運用

Vitest(Workers 向けプール)によるテスト、GitHub Actions、環境分離を扱います。

本文にはテスト対象の `src/` がありません。テストが読む `src/` と `migrations/` は、第8章の SaaS MVP の写しです。第8章を直したら `npm run sync` で写し直します(手で直しません)。

## ファイル構成

```
ch10-testing-cicd/
  test/health.test.ts           # ヘルスチェックのテスト
  test/resources.test.ts        # リソース API のテスト(D1 のマイグレーション適用と初期データ)
  test/quota.test.ts            # KV のテスト
  test/helpers/seed.ts          # テナントと API キーの初期データ
  test/env.d.ts                 # テストの env の型
  vitest.config.ts              # Vitest 設定(D1 のマイグレーションを渡す)
  steps/                        # 本文の途中の版(最初の vitest.config.ts など)
  .github/workflows/deploy.yml  # GitHub Actions のデプロイ
  wrangler.toml                 # 環境別の Wrangler 設定
  src/, migrations/             # 第8章の写し(scripts/sync-from-ch08.sh)
  .dev.vars.example             # ローカル開発のシークレットの例
```

## セットアップとコマンド

```bash
npm install
npm run check    # 型検査 (tsc --noEmit)
npm test         # vitest run
npm run sync     # 第8章の変更を src/ と migrations/ に写す
```

## バインディングについて

`wrangler.toml` の `database_id` は書籍と同じダミー値です。実際に使う場合は `npx wrangler d1 create` で作成した値に置き換えてください。テストはローカルの workerd 上のバインディングを使うため、ダミー値のままで動きます。

## 本書との対応

本書 第10章 テスト・CI/CD・運用 のコードサンプルです。
