# 第10章 テスト・CI/CD・運用

Vitest(Workers 向けプール)によるテスト、GitHub Actions、環境分離を扱います。本文にはテスト対象の src/ が含まれません(第8章のコードを前提としています)。

書籍の本文のコードを、書かれているファイルパスのまま配置しています。

## ファイル構成

```
ch10-testing-cicd/
  test/health.test.ts               # ヘルスチェックのテスト
  test/resources.test.ts            # リソース API のテスト
  test/quota.test.ts                # クォータのテスト
  vitest.config.ts                  # Vitest 設定
  .github/workflows/deploy.yml      # GitHub Actions のデプロイ
  wrangler.toml                     # 環境別の Wrangler 設定
  package.json, tsconfig.json, .npmrc  # 依存の版と型検査の設定
```

## セットアップとコマンド

```bash
npm install
npm run check    # 型検査 (tsc --noEmit)
npm test         # vitest run
```

## バインディングについて

`wrangler.toml` の `database_id` は書籍と同じダミー値です。実際に使う場合は `npx wrangler d1 create` で作成した値に置き換えてください。

R2 バケット・KV の名前と ID も書籍と同じ値です。`npx wrangler r2 bucket create` / `npx wrangler kv namespace create` で作成して置き換えてください。

## 本書との対応

本書 第10章 テスト・CI/CD・運用 のコードサンプルです。
