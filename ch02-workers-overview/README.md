# 第2章 Cloudflare Workers の全体像

Workers の実行モデル、バインディング、wrangler.toml を扱います。本文の最後の例が src/index.ts です。

書籍の本文のコードを、書かれているファイルパスのまま配置しています。

## ファイル構成

```
ch02-workers-overview/
  src/index.ts                      # 最後の例のエントリポイント
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

本書 第2章 Cloudflare Workers の全体像 のコードサンプルです。
