# 第2章: Cloudflare Workers の全体像 -- バインディングとスケジュールイベント

Cloudflare Workers Runtime の仕組みと、Wrangler による開発環境の構築方法を学ぶサンプルです。D1 / R2 / KV の各バインディングへの接続確認、リクエストメタデータの取得、Scheduled Event (cron トリガー) の実装を扱います。

## この章で学ぶこと

- Workers Runtime (`workerd`) の実行モデルと ESM 形式のモジュールエクスポート
- `wrangler.toml` によるバインディング設定 (D1, R2, KV)
- `Hono<{ Bindings: Bindings }>` による型安全なバインディングアクセス
- `c.req.raw.cf` によるリクエストメタデータ (地理情報等) の取得
- Scheduled Event ハンドラ (cron トリガー) の実装
- `export default { fetch, scheduled }` による複数エントリポイントの公開

## ファイル構成

```
ch02-workers-overview/
  src/
    index.ts          # アプリのエントリポイント (バインディングチェック、cron ハンドラ)
  package.json
  tsconfig.json
  wrangler.toml       # D1, R2, KV バインディング設定
```

## セットアップ

この章では D1 / R2 / KV のバインディングを使用します。ローカル開発では Wrangler がバインディングをエミュレートしますが、事前にリソースを作成して `wrangler.toml` を更新する必要があります。

```bash
npm install

# D1 データベースを作成
wrangler d1 create my-database

# R2 バケットを作成
wrangler r2 bucket create my-bucket

# KV ネームスペースを作成
wrangler kv namespace create KV
```

各コマンドの出力に含まれる `database_id` や `id` を `wrangler.toml` に反映してください。

## 実行方法

```bash
npm run dev
```

開発サーバーが `http://localhost:8787` で起動します。以下の curl コマンドで動作を確認できます。

```bash
# Workers 情報
curl http://localhost:8787/

# リクエストメタデータ (ヘッダ、cf オブジェクト)
curl http://localhost:8787/info

# D1 バインディング接続チェック
curl http://localhost:8787/d1/check

# R2 バインディング接続チェック
curl http://localhost:8787/r2/check

# KV バインディング接続チェック
curl http://localhost:8787/kv/check
```

## 使用する主要 API

- **`Hono<{ Bindings: Bindings }>`** -- 型安全なバインディング定義
- **`c.env.DB`** -- D1 データベースバインディング
- **`c.env.BUCKET`** -- R2 バケットバインディング
- **`c.env.KV`** -- KV ネームスペースバインディング
- **`c.req.raw.cf`** -- Cloudflare 固有のリクエストメタデータ
- **`scheduled(event, env, ctx)`** -- cron トリガーのイベントハンドラ
- **`ctx.waitUntil()`** -- 非同期処理の完了を待機

## 本書との対応

本書 第2章「Cloudflare Workers の全体像 -- 無料枠で何ができるか」のコードサンプルに対応します。

## 無料枠メモ

この章のサンプルは Cloudflare Workers 無料プランで動作します。D1 (5M reads/日, 100K writes/日)、R2 (10GB ストレージ, 10M Class B ops/月)、KV (100K reads/日, 1K writes/日) はいずれも無料枠の範囲内です。cron トリガーは無料プランでも利用できます。
