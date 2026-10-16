# 第9章 Workers AI

テキスト生成、画像生成、Embedding を扱います。節ごとの追加ルートの多くは本文中の単体の例で、src/routes/ai.ts は 9.7 のモジュール分割版です。

書籍の本文のコードを、書かれているファイルパスのまま配置しています。

## ファイル構成

```
ch09-workers-ai/
  src/index.ts                      # エントリポイント
  src/routes/ai.ts                  # Workers AI のルート(9.7 の版)
  wrangler.toml                     # Wrangler 設定(AI バインディング)
  package.json, tsconfig.json  # 依存の版と型検査の設定
```

## セットアップとコマンド

```bash
npm install
npm run check    # 型検査 (tsc --noEmit)
```

開発サーバー(`npm run dev`)は、本文の通りに `wrangler.toml` のバインディングを用意してから起動してください。

## バインディングについて

R2 バケット・KV の名前と ID も書籍と同じ値です。`npx wrangler r2 bucket create` / `npx wrangler kv namespace create` で作成して置き換えてください。

## 本書との対応

本書 第9章 Workers AI のコードサンプルです。
