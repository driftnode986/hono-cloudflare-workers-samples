# 第1章 Hono とは何か

ルーティング、Context、ミドルウェア、ファクトリを扱います。本文では例ごとに src/index.ts を書き換えて進むため、このディレクトリの src/index.ts は章の最後の例です。

書籍の本文のコードを、書かれているファイルパスのまま配置しています。

## ファイル構成

```
ch01-hono-basics/
  src/index.ts                      # 最後の例のエントリポイント
  src/factory.ts                    # createFactory による共通設定
  src/routes/users.ts               # ルート分割の例
  src/middleware/timing.ts          # 処理時間ミドルウェア
  src/middleware/prefix-logger.ts   # ログ出力ミドルウェア
  src/middleware/request-id.ts      # リクエスト ID ミドルウェア
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

本書 第1章 Hono とは何か のコードサンプルです。
