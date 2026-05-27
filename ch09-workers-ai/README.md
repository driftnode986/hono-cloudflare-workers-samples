# 第9章: Workers AI -- エッジで AI 推論を動かす

Workers AI を使ったテキスト生成、要約、感情分類、翻訳、画像認識、ストリーミングレスポンスを学ぶサンプルです。Hono のルートハンドラから Workers AI の各モデルを呼び出す実装パターンを扱います。

## この章で学ぶこと

- Workers AI バインディングの設定と `c.env.AI.run()` による推論呼び出し
- Llama 3.1 (`@cf/meta/llama-3.1-8b-instruct`) によるテキスト生成と要約
- DistilBERT (`@cf/huggingface/distilbert-sst-2-int8`) による感情分類
- M2M-100 (`@cf/meta/m2m100-1.2b`) による多言語翻訳
- LLaVA (`@cf/llava-hf/llava-1.5-7b-hf`) による画像からテキストへの変換
- `stream: true` オプションと Server-Sent Events (SSE) によるストリーミングレスポンス

## ファイル構成

```
ch09-workers-ai/
  src/
    index.ts          # Workers AI の各モデルを呼び出すエンドポイント
  package.json
  tsconfig.json
  wrangler.toml       # AI バインディング設定
```

## セットアップ

```bash
npm install
```

`wrangler.toml` に `[ai]` バインディングが設定済みです。追加のリソース作成は不要です。

Workers AI はローカル開発時でもリモートの Cloudflare インフラで推論が実行されます。そのため、Cloudflare アカウントにログイン済みの状態 (`wrangler login`) が必要です。

## 実行方法

```bash
npm run dev
```

開発サーバーが `http://localhost:8787` で起動します。以下の curl コマンドで動作を確認できます。

```bash
# エンドポイント一覧
curl http://localhost:8787/

# テキスト生成
curl -X POST http://localhost:8787/ai/text \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Explain serverless computing in 3 sentences"}'

# テキスト要約
curl -X POST http://localhost:8787/ai/summarize \
  -H 'Content-Type: application/json' \
  -d '{"text":"Cloudflare Workers is a serverless execution environment that allows you to create new applications or augment existing ones without configuring or maintaining infrastructure. Workers runs on the Cloudflare global network in over 300 cities around the world, offering both speed and reliability."}'

# 感情分類
curl -X POST http://localhost:8787/ai/classify \
  -H 'Content-Type: application/json' \
  -d '{"text":"This product is amazing!"}'

# 翻訳 (英語 -> 日本語)
curl -X POST http://localhost:8787/ai/translate \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hello world","sourceLang":"en","targetLang":"ja"}'

# 画像からテキスト (画像ファイルをバイナリで送信)
curl -X POST http://localhost:8787/ai/image-to-text \
  -H 'Content-Type: image/jpeg' \
  --data-binary @path/to/image.jpg

# ストリーミングテキスト生成 (SSE)
curl -X POST http://localhost:8787/ai/stream \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Write a haiku about coding"}'
```

## 使用する主要 API

- **`c.env.AI.run(model, inputs)`** -- Workers AI モデルの実行
- **`@cf/meta/llama-3.1-8b-instruct`** -- テキスト生成モデル (messages 形式)
- **`@cf/huggingface/distilbert-sst-2-int8`** -- 感情分類モデル
- **`@cf/meta/m2m100-1.2b`** -- 多言語翻訳モデル
- **`@cf/llava-hf/llava-1.5-7b-hf`** -- 画像認識 (image-to-text) モデル
- **`stream: true`** -- ストリーミング推論オプション
- **`ReadableStream`** -- SSE レスポンスとしてのストリーム返却

## 本書との対応

本書 第9章「Workers AI -- エッジで AI 推論を動かす」のコードサンプルに対応します。

## 無料枠メモ

Workers AI は Cloudflare 無料プランで利用できます。無料枠のモデル推論数には制限があり、使用量はモデルごとに異なります (Neurons 単位での計測)。本書のサンプル規模の試用であれば無料枠で十分ですが、大量リクエストを処理する場合は Cloudflare ダッシュボードで使用量を確認してください。
