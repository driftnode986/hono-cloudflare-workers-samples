# 第5章 R2 と KV

R2 のファイル操作、KV のキャッシュとセッションを扱います。

書籍の本文のコードを、書かれているファイルパスのまま配置しています。

## ファイル構成

```
ch05-r2-kv/
  src/index.ts                      # エントリポイント
  src/types.ts                      # バインディングの型
  src/routes/files.ts               # R2 のファイル操作ルート
  src/routes/images.ts              # 画像アップロードルート
  src/routes/config.ts              # KV 設定値の読み書き
  src/routes/auth.ts                # セッションを使うルート
  src/middleware/kv-cache.ts        # KV キャッシュミドルウェア
  src/middleware/session.ts         # セッションミドルウェア
  wrangler.toml                     # Wrangler 設定(D1・R2・KV)
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

本書 第5章 R2 と KV のコードサンプルです。
