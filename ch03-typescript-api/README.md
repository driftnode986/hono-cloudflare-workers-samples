# 第3章: 型安全な API 設計パターン -- Zod バリデーションと RPC モード

Hono と Zod を組み合わせた型安全な API 設計を学ぶサンプルです。リクエストボディ・クエリパラメータの自動バリデーション、Zod スキーマからの型推論、RPC モードによる型安全なクライアント生成の仕組みを扱います。

## この章で学ぶこと

- Zod によるリクエストスキーマの定義 (`z.object()`, `z.string()`, `z.number()` 等)
- `zValidator` ミドルウェアによる JSON ボディ・クエリパラメータの自動バリデーション
- `z.infer<typeof schema>` によるスキーマからの TypeScript 型推論
- `.partial()` を使った更新用スキーマの派生
- `z.coerce` によるクエリパラメータの型変換とデフォルト値
- RPC モードによるメソッドチェーン形式のルート定義と `AppType` のエクスポート

## ファイル構成

```
ch03-typescript-api/
  src/
    index.ts          # Zod バリデーション付きルートと RPC モードの定義
  package.json
  tsconfig.json
  wrangler.toml
```

## セットアップ

この章では外部バインディングを使わないため、`wrangler.toml` の編集は不要です。

```bash
npm install
```

## 実行方法

```bash
npm run dev
```

開発サーバーが `http://localhost:8787` で起動します。以下の curl コマンドで動作を確認できます。

```bash
# クエリパラメータのバリデーション (page, limit, sort にデフォルト値あり)
curl "http://localhost:8787/users?page=1&limit=10&sort=name"

# JSON ボディのバリデーション (正常系)
curl -X POST http://localhost:8787/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice","email":"alice@example.com","age":30}'

# バリデーションエラー (email フィールドが未指定)
curl -X POST http://localhost:8787/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice"}'

# 部分更新 (partial スキーマ)
curl -X PUT http://localhost:8787/users/user-001 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Bob"}'

# RPC ルート
curl http://localhost:8787/rpc/posts
curl http://localhost:8787/rpc/posts/1

# RPC ルートへの POST
curl -X POST http://localhost:8787/rpc/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hello Hono","body":"Type-safe API"}'
```

## 使用する主要 API

- **`z.object()` / `z.string()` / `z.number()`** -- Zod スキーマの定義
- **`zValidator('json', schema)`** -- JSON ボディのバリデーションミドルウェア
- **`zValidator('query', schema)`** -- クエリパラメータのバリデーションミドルウェア
- **`c.req.valid('json')` / `c.req.valid('query')`** -- バリデーション済みデータの取得
- **`z.infer<typeof schema>`** -- スキーマから TypeScript 型を推論
- **`export type AppType = typeof rpc`** -- RPC クライアント (`hc`) 用の型エクスポート

## 本書との対応

本書 第3章「Hono x TypeScript -- 型安全な API 設計パターン」のコードサンプルに対応します。

## 無料枠メモ

この章のサンプルは Cloudflare Workers の無料プランで動作します。バインディングを使用しないため、Workers のリクエスト数制限のみが適用されます。
