# 第6章 認証とセキュリティ

JWT、API キー、CORS、セキュリティヘッダー、レート制限を扱います。

コードは、型検査とテストを通したものを本文に差し込んでいます。

## ファイル構成

```
ch06-auth-security/
  src/index.ts                      # エントリポイント (保護ルート・CORS・レート制限の組み込み)
  src/routes/auth.ts                # ログインと JWT 発行
  src/lib/password.ts               # パスワードハッシュ (PBKDF2)
  src/lib/users.ts                  # メールアドレスでユーザーを引く (D1)
  src/middleware/auth.ts            # JWT 検証とロール確認
  src/middleware/api-key.ts         # API キー認証
  src/middleware/multi-api-key.ts   # 複数の API キーに対応した版
  src/middleware/cors-config.ts     # 環境別の CORS 設定
  src/middleware/rate-limit.ts      # KV を使ったレート制限
  src/examples/                     # 本文の個別の例 (複数オリジン・CSP など)
  src/steps/                        # 本文の途中の版 (wrangler.toml の断片など)
  test/                             # vitest のテスト
  wrangler.toml                     # Wrangler 設定
```

## セットアップとコマンド

```bash
npm install
npm run check    # 型検査 (tsc --noEmit)
npm test         # テスト (vitest + @cloudflare/vitest-pool-workers)
```

テストは Workers ランタイム (workerd) の上で、D1 と KV の実物 (ローカル) を使って動きます。
`API_KEY` などのシークレットは `vitest.config.ts` でテスト用の値を渡しています。

開発サーバー (`npm run dev`) は、`wrangler.toml` の `database_id` と KV の `id` を、
自分のアカウントで作成した値に置き換えてから起動してください。

## 本書との対応

本書 第6章 認証とセキュリティ のコードサンプルです。
