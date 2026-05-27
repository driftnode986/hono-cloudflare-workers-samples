# 第1章: Hono の基礎 -- ルーティング、Context、ミドルウェア

Hono フレームワークの基本的な使い方を学ぶサンプルです。ルーティング定義、Context オブジェクトによるレスポンス生成、ビルトインミドルウェアとカスタムミドルウェアの作成、エラーハンドリングの仕組みを扱います。

バインディング (D1, R2 等) は使わず、Hono 単体で動作します。

## この章で学ぶこと

- `app.get()` / `app.post()` によるルート定義とパスパラメータ・クエリパラメータの取得
- `c.json()` / `c.text()` による Context オブジェクトを使ったレスポンス生成
- `logger()` / `prettyJSON()` 等のビルトインミドルウェアの適用
- カスタムミドルウェアの作成 (レスポンスタイムヘッダの付与)
- `app.route()` によるルートグルーピング
- `onError` / `notFound` ハンドラと `HTTPException` によるエラーハンドリング

## ファイル構成

```
ch01-hono-basics/
  src/
    index.ts          # アプリのエントリポイント (全ルート・ミドルウェア定義)
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
# ルートエンドポイント
curl http://localhost:8787/

# パスパラメータ
curl http://localhost:8787/users/123

# クエリパラメータ
curl "http://localhost:8787/search?q=hono&page=2"

# POST リクエスト (JSON ボディ)
curl -X POST http://localhost:8787/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice","email":"alice@example.com"}'

# ルートグルーピング (/api 配下)
curl http://localhost:8787/api/health
curl http://localhost:8787/api/version

# 404 ハンドリング
curl http://localhost:8787/not-exists
```

## 使用する主要 API

- **`new Hono()`** -- アプリケーションインスタンスの生成
- **`app.get()` / `app.post()`** -- HTTP メソッドに対応するルート登録
- **`c.req.param()` / `c.req.query()`** -- パスパラメータ・クエリパラメータの取得
- **`c.json()` / `c.text()`** -- JSON / テキストレスポンスの生成
- **`app.use()`** -- ミドルウェアの登録
- **`app.route()`** -- ルートのグルーピングとマウント
- **`HTTPException`** -- 構造化されたエラーレスポンスの送出

## 本書との対応

本書 第1章「Hono とは何か -- Web Standards で作る超軽量フレームワーク」のコードサンプルに対応します。

## 無料枠メモ

この章のサンプルは Cloudflare Workers の無料プランで動作します。バインディングを使用しないため、Workers のリクエスト数制限 (無料プラン: 100,000 リクエスト/日) のみが適用されます。
