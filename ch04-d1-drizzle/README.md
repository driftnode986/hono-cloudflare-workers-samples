# 第4章 D1 と Drizzle ORM

D1 のセットアップ、Drizzle のスキーマ、マイグレーション、CRUD を扱います。

書籍の本文のコードを、書かれているファイルパスのまま配置しています。

## ファイル構成

```
ch04-d1-drizzle/
  drizzle.config.ts                 # drizzle-kit の設定(リモート D1 接続版)
  src/db/schema.ts                  # テーブル定義
  src/db/index.ts                   # Drizzle クライアントの生成
  src/index.ts                      # エントリポイント
  src/routes/posts.ts               # 記事の CRUD ルート
  wrangler.toml                     # Wrangler 設定(D1 バインディング)
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

## 本書との対応

本書 第4章 D1 と Drizzle ORM のコードサンプルです。
