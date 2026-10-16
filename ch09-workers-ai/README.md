# 第9章 Workers AI

テキスト生成、ストリーミング、画像生成、Embedding、Vectorize、KV キャッシュを扱います。

## ファイル構成

```
ch09-workers-ai/
  src/index.ts                  # エントリポイント(9.7 の版)
  src/routes/ai.ts              # 本章のルートをまとめたルーター(完成版)
  src/lib/image.ts              # Base64 の画像データをバイト列に戻す
  src/lib/embed.ts              # 埋め込みベクトルを取り出す
  src/types/workers-ai-models.d.ts  # workers-types に未登録のモデル名を登録
  src/steps/                    # 本文の途中の版(節ごとに書き換わるコード)
  steps/wrangler.*.toml         # 本文の途中の wrangler.toml
  wrangler.toml                 # 完成版の Wrangler 設定
  test/                         # Vitest のテスト(Workers AI などは偽物で代用)
```

## セットアップとコマンド

```bash
npm install
npm run check    # 型検査 (tsc --noEmit)
npm test         # vitest run
```

テストの Workers AI・R2・KV・Vectorize は `test/helpers/fakes.ts` の偽物です。実物の Workers AI はローカルでも実際の Cloudflare API を呼び、Neuron を消費するため、テストでは呼びません。

## バインディングについて

`wrangler.toml` の KV の ID は書籍と同じダミー値です。`npx wrangler r2 bucket create` / `npx wrangler kv namespace create` で作成して置き換えてください。Vectorize のインデックスは `npx wrangler vectorize create` で作成します。

## 本書との対応

本書 第9章 Workers AI のコードサンプルです。
