# 第3章 Hono × TypeScript

Zod バリデーション、型の共有、RPC クライアント、OpenAPI を扱います。本文の最後の例が src/index.ts(OpenAPI 版)です。

書籍の本文のコードを、書かれているファイルパスのまま配置しています。

## ファイル構成

```
ch03-typescript-api/
  src/index.ts                      # OpenAPI 版のエントリポイント
  src/openapi-routes/posts.ts       # OpenAPI ルート定義
  src/schemas/post.ts               # Zod スキーマ
  src/lib/validator-hook.ts         # バリデーションエラーのフック
  src/factory.ts                    # ファクトリ
  src/types.ts                      # 型定義
  src/middleware/auth.ts            # 認証ミドルウェア
  src/middleware/request-id.ts      # リクエスト ID ミドルウェア
  src/routes/posts.ts               # 記事ルート(app.route による分割の例)
  src/routes/users.ts               # ユーザールート
  src/routes/me.ts                  # 認証済みユーザーのルート
  client.ts                         # hc による型安全クライアント
  wrangler.toml                     # Wrangler 設定
  package.json, tsconfig.json  # 依存の版と型検査の設定
```

## セットアップとコマンド

```bash
npm install
npm run check    # 型検査 (tsc --noEmit)
```

開発サーバー(`npm run dev`)は、本文の通りに `wrangler.toml` のバインディングを用意してから起動してください。

## バインディングについて

`wrangler.toml` の `database_id` は書籍と同じダミー値です。実際に使う場合は `npx wrangler d1 create` で作成した値に置き換えてください。

R2 バケット・KV の名前と ID も書籍と同じ値です。`npx wrangler r2 bucket create` / `npx wrangler kv namespace create` で作成して置き換えてください。

## 本書との対応

本書 第3章 Hono × TypeScript のコードサンプルです。
