# 第7章 ブログ API

D1・R2・JWT を組み合わせたブログ API です。

書籍の本文のコードを、書かれているファイルパスのまま配置しています。

## ファイル構成

```
ch07-blog-api/
  drizzle.config.ts                 # drizzle-kit の設定
  src/db/schema.ts                  # テーブル定義
  src/db/index.ts                   # Drizzle クライアントの生成
  src/types.ts                      # バインディングの型
  src/index.ts                      # エントリポイント
  src/routes/auth.ts                # 登録とログイン
  src/routes/posts.ts               # 記事の CRUD
  src/routes/images.ts              # カバー画像のアップロードと配信
  src/middleware/auth.ts            # JWT 認証
  src/lib/markdown.ts               # Markdown の HTML 変換
  wrangler.toml                     # Wrangler 設定
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

本書 第7章 ブログ API のコードサンプルです。
