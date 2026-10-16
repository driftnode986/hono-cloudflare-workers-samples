# 第3章 Hono × TypeScript

Zod バリデーション、型の共有、RPC クライアント、OpenAPI を扱います。本文の最後の例が src/index.ts(OpenAPI 版)です。

このディレクトリのコードは型検査(`npm run check`)とテスト(`npm test`)が通ることを確かめています。

## ファイル構成

```
ch03-typescript-api/
  src/index.ts                      # OpenAPI 版のエントリポイント(最終版)
  src/openapi-routes/posts.ts       # OpenAPI ルート定義
  src/schemas/post.ts               # Zod スキーマ
  src/lib/validator-hook.ts         # バリデーションエラーのフック
  src/lib/find-post.ts              # 記事を探す関数(RPC の例で使う)
  src/factory.ts                    # ファクトリ
  src/types.ts                      # 型定義
  src/middleware/auth.ts            # 認証ミドルウェア
  src/middleware/request-id.ts      # リクエスト ID ミドルウェア
  src/routes/posts.ts               # 記事ルート(app.route による分割の例)
  src/routes/users.ts               # ユーザールート
  src/routes/me.ts                  # 認証済みユーザーのルート
  wrangler.toml                     # Wrangler 設定
  package.json, tsconfig.json  # 依存の版と型検査の設定
  test/                             # vitest のテスト
```

## 途中の版(steps)

本文は同じファイルを節ごとに書き換えていきます。最終版以外の途中の版は、別のファイルとして置いています。

- `src/index.zvalidator.ts` — 3.1 の `src/index.ts`(JSON ボディの検証)
- `src/routes/posts.validators.ts` — 3.1〜3.2 の `src/routes/posts.ts`(クエリ・パス・フック・更新)
- `src/index.env.ts` — 3.3 の `src/index.ts`(`AppEnv` を付けた `Hono`)
- `src/routes/posts.factory.ts` — 3.3 の `src/routes/posts.ts`(`createFactory`)
- `src/index.routes.ts` — 3.5 の `src/index.ts`(`app.route()` で合成)
- `steps/rpc/` — 3.5 の RPC モード(`src/index.ts` と `client.ts`)
- `steps/rpc-status/` — 3.5 のステータスコード別の型分岐(`src/index.ts` と `client.ts`)

## セットアップとコマンド

```bash
npm install
npm run check    # 型検査 (tsc --noEmit)
npm test         # vitest
```

開発サーバー(`npm run dev`)は、本文の通りに `wrangler.toml` のバインディングを用意してから起動してください。

## バインディングについて

`wrangler.toml` の `database_id` は書籍と同じダミー値です。実際に使う場合は `npx wrangler d1 create` で作成した値に置き換えてください。

R2 バケット・KV の名前と ID も書籍と同じ値です。`npx wrangler r2 bucket create` / `npx wrangler kv namespace create` で作成して置き換えてください。

## 本書との対応

本書 第3章 Hono × TypeScript のコードサンプルです。
