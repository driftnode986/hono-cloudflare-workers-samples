# 第8章 SaaS MVP

マルチテナント、API キー、クォータ、Queues を扱います。

書籍の本文のコードを、書かれているファイルパスのまま配置しています。

## ファイル構成

```
ch08-saas-mvp/
  src/db/schema.ts                  # テーブル定義
  src/types.ts                      # バインディングの型
  src/index.ts                      # エントリポイント
  src/routes/api-keys.ts            # API キーの発行
  src/routes/resources.ts           # リソースの CRUD
  src/middleware/tenant.ts          # テナント識別
  src/middleware/quota.ts           # プラン別クォータ
  src/queue.ts                      # Queues のコンシューマ
  wrangler.toml                     # Wrangler 設定(D1・KV・Queues)
  package.json, tsconfig.json  # 依存の版と型検査の設定
```

## セットアップとコマンド

```bash
npm install
npm run check    # 型検査 (tsc --noEmit)
npm run db:generate   # マイグレーションの生成
```

開発サーバー(`npm run dev`)は、本文の通りに `wrangler.toml` のバインディングを用意してから起動してください。

## バインディングについて

`wrangler.toml` の `database_id` は書籍と同じダミー値です。実際に使う場合は `npx wrangler d1 create` で作成した値に置き換えてください。

R2 バケット・KV の名前と ID も書籍と同じ値です。`npx wrangler r2 bucket create` / `npx wrangler kv namespace create` で作成して置き換えてください。

## 本書との対応

本書 第8章 SaaS MVP のコードサンプルです。
