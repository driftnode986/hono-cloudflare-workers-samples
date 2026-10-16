# 第6章 認証とセキュリティ

JWT、API キー、CORS、セキュリティヘッダー、レート制限を扱います。

書籍の本文のコードを、書かれているファイルパスのまま配置しています。

## ファイル構成

```
ch06-auth-security/
  src/index.ts                      # エントリポイント
  src/routes/auth.ts                # ログインと JWT 発行
  src/middleware/auth.ts            # JWT 検証とロール確認
  src/middleware/api-key.ts         # API キー認証
  src/middleware/cors-config.ts     # CORS 設定
  src/middleware/rate-limit.ts      # レート制限
  src/lib/password.ts               # パスワードハッシュ
  wrangler.toml                     # Wrangler 設定
  package.json, tsconfig.json  # 依存の版と型検査の設定
```

## セットアップとコマンド

```bash
npm install
npm run check    # 型検査 (tsc --noEmit)
```

開発サーバー(`npm run dev`)は、本文の通りに `wrangler.toml` のバインディングを用意してから起動してください。

## 本書との対応

本書 第6章 認証とセキュリティ のコードサンプルです。
