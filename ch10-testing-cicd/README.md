# 第10章: テスト・CI/CD・本番運用 -- Vitest と GitHub Actions

Vitest と `@cloudflare/vitest-pool-workers` による Workers 環境でのインテグレーションテスト、GitHub Actions を使った CI/CD パイプライン (型チェック -> テスト -> デプロイ) を学ぶサンプルです。

## この章で学ぶこと

- `@cloudflare/vitest-pool-workers` による Workers Runtime 上でのテスト実行
- `defineWorkersConfig` による Vitest の Workers プール設定
- `app.request()` を使った Hono ハンドラのインテグレーションテスト
- `beforeAll` での D1 スキーマセットアップ (テスト前のマイグレーション)
- CRUD テストパターン (作成、一覧、単体取得、削除、エラーケース)
- GitHub Actions ワークフロー (`test` ジョブ -> `deploy` ジョブ)
- `cloudflare/wrangler-action` による自動デプロイ

## ファイル構成

```
ch10-testing-cicd/
  src/
    index.ts                      # テスト対象の Items CRUD アプリ
  test/
    index.test.ts                 # Vitest インテグレーションテスト
  .github/
    workflows/
      deploy.yml                  # GitHub Actions CI/CD ワークフロー
  vitest.config.ts                # Workers プール設定
  package.json                    # vitest, @cloudflare/vitest-pool-workers を含む依存関係
  tsconfig.json
  wrangler.toml                   # D1 バインディング設定
```

## セットアップ

```bash
npm install

# D1 データベースを作成
wrangler d1 create test-db

# wrangler.toml の database_id を返却された値に更新
```

テスト実行時は `beforeAll` で D1 のテーブルが自動作成されるため、マイグレーションの手動適用は不要です。

## テストの実行

```bash
npm test
```

Vitest が Workers Runtime プール上でテストを実行します。D1 バインディングの実環境に近いテストが可能です。

テスト結果の例:

```
 ✓ Health check
   ✓ GET / returns status ok
 ✓ Items CRUD
   ✓ POST /items creates an item
   ✓ GET /items lists items
   ✓ GET /items/:id returns a single item
   ✓ GET /items/:id returns 404 for missing item
   ✓ DELETE /items/:id deletes an item
   ✓ POST /items returns 400 without name
```

## ローカル開発サーバーの起動

```bash
npm run dev
```

開発サーバーが `http://localhost:8787` で起動します。以下の curl コマンドで動作を確認できます。

```bash
# ヘルスチェック
curl http://localhost:8787/

# アイテムを作成
curl -X POST http://localhost:8787/items \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Item","description":"A test item"}'

# アイテム一覧を取得
curl http://localhost:8787/items

# アイテムを ID で取得
curl http://localhost:8787/items/1

# アイテムを削除
curl -X DELETE http://localhost:8787/items/1

# バリデーションエラー (name なし)
curl -X POST http://localhost:8787/items \
  -H 'Content-Type: application/json' \
  -d '{"description":"No name"}'
```

## CI/CD のセットアップ

GitHub リポジトリに以下の Secrets を設定してください。

- **`CLOUDFLARE_API_TOKEN`** -- Workers の読み書き権限を持つ API トークン
- **`CLOUDFLARE_ACCOUNT_ID`** -- Cloudflare アカウント ID

ワークフローの動作:

- **push / pull_request (main ブランチ)** -- 型チェック (`tsc --noEmit`) とテスト (`vitest run`) を実行
- **main ブランチへの push** -- テスト通過後に `wrangler deploy` で自動デプロイ

## 使用する主要 API

- **`defineWorkersConfig()`** -- Vitest の Workers プール設定
- **`import { env } from 'cloudflare:test'`** -- テスト環境のバインディング取得
- **`app.request(path, init, env)`** -- Hono アプリへのテストリクエスト送信
- **`env.DB.exec(sql)`** -- テスト用 D1 への直接 SQL 実行
- **`cloudflare/wrangler-action@v3`** -- GitHub Actions の Wrangler デプロイアクション

## 本書との対応

本書 第10章「テスト・CI/CD・本番運用」のコードサンプルに対応します。

## 無料枠メモ

この章のサンプルは Cloudflare Workers 無料プランで動作します。GitHub Actions は GitHub の無料枠 (パブリックリポジトリは無制限、プライベートは 2,000 分/月) で実行できます。`wrangler deploy` による Workers のデプロイ自体に追加料金は発生しません。
