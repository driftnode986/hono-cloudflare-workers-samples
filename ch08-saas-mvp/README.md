# 第8章: プロジェクト実践 SaaS MVP バックエンド -- Durable Objects と Queues

マルチテナント対応の SaaS バックエンド API を構築するプロジェクト実践のサンプルです。テナント管理、API キー認証、Durable Objects によるテナント単位のレート制限、Queues による非同期タスク処理 (Producer + Consumer) を扱います。

## この章で学ぶこと

- マルチテナントデータモデルの設計 (`tenants`, `apiKeys`, `tasks` の 3 テーブル)
- API キー認証ミドルウェア (`Authorization: Bearer sk_...` 形式)
- テナント作成時の自動 API キー発行
- Durable Objects によるテナント単位の精密なレート制限
- Queues による非同期タスクの投入 (Producer) と処理 (Consumer)
- タスクのライフサイクル管理 (`pending` -> `processing` -> `completed` / `failed`)

## ファイル構成

```
ch08-saas-mvp/
  src/
    index.ts              # アプリのエントリポイント、Durable Object (RateLimiter)、Queue Consumer
    db/
      schema.ts           # Drizzle ORM スキーマ (tenants, apiKeys, tasks)
    middleware/
      api-key.ts          # API キー認証ミドルウェア
    routes/
      tenants.ts          # テナント管理エンドポイント
  package.json            # drizzle-orm, drizzle-kit を含む依存関係
  tsconfig.json
  wrangler.toml           # D1, Queues, Durable Objects の設定
```

## セットアップ

```bash
npm install

# D1 データベースを作成
wrangler d1 create saas-db

# Queue を作成
wrangler queues create saas-tasks

# wrangler.toml の database_id を返却された値に更新

# マイグレーションファイルを生成
npm run db:generate

# ローカル D1 にマイグレーションを適用
npm run db:migrate
```

Durable Objects はローカル開発時に Wrangler が自動でエミュレートするため、追加の設定は不要です。

## 実行方法

```bash
npm run dev
```

開発サーバーが `http://localhost:8787` で起動します。以下の curl コマンドで一連の操作を確認できます。

```bash
# ヘルスチェック
curl http://localhost:8787/

# テナントを作成 (API キーが自動発行されます)
curl -X POST http://localhost:8787/tenants \
  -H 'Content-Type: application/json' \
  -d '{"name":"Acme Corp","slug":"acme","plan":"pro"}'

# テナント情報を取得
curl http://localhost:8787/tenants/acme

# API キーを変数に格納
API_KEY="<テナント作成レスポンスの apiKey.key 値を貼り付け>"

# 非同期タスクを投入 (API キー認証)
curl -X POST http://localhost:8787/api/tasks \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"type":"process-data","payload":{"input":"hello"}}'

# タスクのステータスを確認
curl http://localhost:8787/api/tasks/1 \
  -H "Authorization: Bearer $API_KEY"
```

## 使用する主要 API

- **`createMiddleware<Env>()`** -- API キー認証ミドルウェア
- **`DurableObject`** -- Durable Objects クラスの実装 (RateLimiter)
- **`DurableObjectState`** -- Durable Object のステート管理
- **`Queue.send(message)`** -- Queue へのメッセージ送信 (Producer)
- **`queue(batch, env)`** -- Queue メッセージの一括処理 (Consumer)
- **`message.ack()` / `message.retry()`** -- メッセージの確認応答と再試行

## 本書との対応

本書 第8章「プロジェクト実践 -- SaaS MVP のバックエンド API」のコードサンプルに対応します。

## 無料枠メモ

Queues と Durable Objects は Cloudflare Workers の無料プランに含まれています。Queues (無料枠: 1M operations/月) と Durable Objects (無料枠: 100K requests/日, 1GB ストレージ) はいずれも開発・小規模運用に十分な枠です。ただし、本番環境でテナント数やリクエスト数が増える場合は Paid プランへの移行を検討してください。
