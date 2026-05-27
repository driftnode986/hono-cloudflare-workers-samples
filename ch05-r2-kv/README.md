# 第5章: R2 オブジェクトストレージと KV -- ファイル管理とキャッシュ戦略

R2 によるファイルのアップロード・ダウンロード・一覧取得と、KV を使ったキャッシュ層・セッション管理を学ぶサンプルです。R2 と KV の使い分けの考え方も扱います。

## この章で学ぶこと

- R2 へのファイルアップロード (`bucket.put()` + httpMetadata / customMetadata)
- R2 からのファイルダウンロード (HTTP ヘッダと ETag の設定)
- R2 オブジェクトの一覧取得 (プレフィックスフィルタリング)
- KV をキャッシュ層として使う (TTL 付きの `put()` / `get()`)
- KV によるセッション管理 (24 時間 TTL 付きセッションの作成・取得)
- R2 (大容量ファイル向き) と KV (小さなキーバリューデータ向き) の使い分け

## ファイル構成

```
ch05-r2-kv/
  src/
    index.ts          # R2 ファイル操作、KV キャッシュ、セッション管理
  package.json
  tsconfig.json
  wrangler.toml       # R2 バケット、KV ネームスペース (CACHE, SESSIONS) の設定
```

## セットアップ

```bash
npm install

# R2 バケットを作成
wrangler r2 bucket create my-files

# KV ネームスペースを作成 (キャッシュ用)
wrangler kv namespace create CACHE

# KV ネームスペースを作成 (セッション用)
wrangler kv namespace create SESSIONS

# wrangler.toml の id を返却された値に更新
```

## 実行方法

```bash
npm run dev
```

開発サーバーが `http://localhost:8787` で起動します。以下の curl コマンドで動作を確認できます。

```bash
# R2: ファイルをアップロード
curl -X POST http://localhost:8787/files/hello.txt \
  -H 'Content-Type: text/plain' \
  -d 'Hello, R2!'

# R2: ファイルをダウンロード
curl http://localhost:8787/files/hello.txt

# R2: ファイル一覧を取得
curl http://localhost:8787/files

# R2: プレフィックスでフィルタ
curl "http://localhost:8787/files?prefix=hello"

# R2: ファイルを削除
curl -X DELETE http://localhost:8787/files/hello.txt

# KV: キャッシュ付きデータ取得 (初回は computed、2回目以降は cache)
curl http://localhost:8787/cached/my-key

# KV: セッションを作成
curl -X POST http://localhost:8787/sessions \
  -H 'Content-Type: application/json' \
  -d '{"userId":"user-123"}'

# KV: セッションを取得 (上記のレスポンスに含まれる sessionId を指定)
curl http://localhost:8787/sessions/<sessionId>
```

## 使用する主要 API

- **`bucket.put(key, body, options)`** -- R2 へのオブジェクト保存 (メタデータ付き)
- **`bucket.get(key)`** -- R2 からのオブジェクト取得
- **`bucket.list({ prefix, limit })`** -- R2 オブジェクト一覧
- **`bucket.delete(key)`** -- R2 オブジェクト削除
- **`object.writeHttpMetadata(headers)`** -- R2 オブジェクトの HTTP メタデータをヘッダに反映
- **`kv.put(key, value, { expirationTtl })`** -- KV への書き込み (TTL 付き)
- **`kv.get(key)`** -- KV からの読み取り

## 本書との対応

本書 第5章「R2 x KV -- ファイルストレージとキャッシュ戦略」のコードサンプルに対応します。

## 無料枠メモ

この章のサンプルは Cloudflare Workers 無料プランで動作します。R2 (10GB ストレージ, 10M Class B ops/月, 1M Class A ops/月) と KV (100K reads/日, 1K writes/日) はいずれも無料枠の範囲内です。
