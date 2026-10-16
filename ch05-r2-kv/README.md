# 第5章 R2 と KV

R2 のファイル操作、KV のキャッシュとセッションを扱います。

コードは、型検査とテストを通したものを本文に差し込んでいます。

## ファイル構成

```
ch05-r2-kv/
  src/index.ts                      # エントリポイント (各ルートの組み込み)
  src/types.ts                      # バインディングの型
  src/routes/files.ts               # R2 のファイル操作ルート
  src/routes/images.ts              # 画像アップロードルート
  src/routes/config.ts              # KV の複数キー読み取り
  src/routes/auth.ts                # セッションを使うログイン・ログアウト
  src/routes/posts.ts               # KV キャッシュを使う記事一覧 (D1)
  src/routes/kv-examples.ts         # KV の基本操作の例
  src/routes/r2-examples.ts         # R2 の複数削除の例
  src/middleware/kv-cache.ts        # KV キャッシュミドルウェア
  src/middleware/session.ts         # セッションミドルウェア
  src/db/                           # Drizzle ORM のスキーマと接続
  src/steps/                        # 本文の途中の版 (wrangler.toml の断片など)
  test/                             # vitest のテスト
  wrangler.toml                     # Wrangler 設定 (D1・R2・KV)
```

## セットアップとコマンド

```bash
npm install
npm run check    # 型検査 (tsc --noEmit)
npm test         # テスト (vitest + @cloudflare/vitest-pool-workers)
```

テストは Workers ランタイム (workerd) の上で、R2・KV・D1 の実物 (ローカル) を使って動きます。

開発サーバー (`npm run dev`) は、`wrangler.toml` の `database_id` と KV の `id` を、
自分のアカウントで作成した値に置き換え、R2 バケットを作成してから起動してください。

## 本書との対応

本書 第5章 R2 と KV のコードサンプルです。
