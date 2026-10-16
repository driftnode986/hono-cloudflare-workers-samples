# 第4章 D1 と Drizzle ORM

D1 のセットアップ、Drizzle のスキーマ、マイグレーション、CRUD を扱います。

このディレクトリのコードは型検査(`npm run check`)とテスト(`npm test`)が通ることを確かめています。テストは `@cloudflare/vitest-pool-workers` で本物の D1(ローカルの SQLite)にマイグレーションを適用して実行します。

## ファイル構成

```
ch04-d1-drizzle/
  drizzle.config.ts                 # drizzle-kit の設定(リモート D1 接続版・最終版)
  drizzle.config.basic.ts           # 4.3 の最初の設定(dialect のみ)
  drizzle/                          # drizzle-kit generate が作ったマイグレーション
  src/db/schema.ts                  # テーブル定義
  src/db/index.ts                   # Drizzle クライアントの生成
  src/types.ts                      # Bindings と AppEnv
  src/index.ts                      # エントリポイント
  src/routes/posts.ts               # 記事の CRUD ルート
  wrangler.toml                     # Wrangler 設定(D1 バインディング)
  test/                             # vitest のテスト
  package.json, tsconfig.json  # 依存の版と型検査の設定
```

## セットアップとコマンド

```bash
npm install
npm run check         # 型検査 (tsc --noEmit)
npm test              # vitest(D1 にマイグレーションを適用して実行)
npm run db:generate   # マイグレーションの生成
```

開発サーバー(`npm run dev`)は、本文の通りに `wrangler.toml` のバインディングを用意してから起動してください。

## バインディングについて

`wrangler.toml` の `database_id` は書籍と同じダミー値です。実際に使う場合は `npx wrangler d1 create` で作成した値に置き換えてください。

`migrations_dir = "drizzle"` は、`drizzle-kit generate` の出力先に `wrangler d1 migrations apply` を合わせる設定です。

## 本書との対応

本書 第4章 D1 と Drizzle ORM のコードサンプルです。
