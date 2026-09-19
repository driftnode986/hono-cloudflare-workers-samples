# Hono + Cloudflare Workers 実践入門 -- サンプルコード

書籍「**Hono + Cloudflare Workers 実践入門 -- 無料枠で動くフルスタックWebアプリを作る**」(牧野 誠 著) の公式サンプルコードリポジトリです。

本書は Hono フレームワークを軸に、Cloudflare Workers のサービス群 (D1, R2, KV, Workers AI) を組み合わせて、無料枠の範囲内でフルスタック Web アプリを構築する方法を解説します。全サンプルが Cloudflare Free プランで動作します。

## 書籍情報

- **書籍名**: Hono + Cloudflare Workers 実践入門 -- 無料枠で動くフルスタックWebアプリを作る
- **著者**: 牧野 誠
- **価格**: ¥980 (Kindle / Kindle Unlimited 対応)
- **Amazon**: https://www.amazon.co.jp/dp/B0H37LKTTN

## 各章のサンプル一覧

| 章 | ディレクトリ | 内容 | 主要技術 |
|----|-------------|------|----------|
| 第1章 | `ch01-hono-basics/` | Hono の基礎 -- ルーティング、Context、ミドルウェア | Hono, logger, prettyJSON, HTTPException |
| 第2章 | `ch02-workers-overview/` | Cloudflare Workers の全体像 -- バインディングとスケジュールイベント | Workers Runtime, D1/R2/KV バインディング, cron |
| 第3章 | `ch03-typescript-api/` | 型安全な API 設計パターン -- Zod バリデーションと RPC モード | Zod, zValidator, RPC, hc client |
| 第4章 | `ch04-d1-drizzle/` | D1 データベース -- Drizzle ORM で型安全なデータ操作 | D1, Drizzle ORM, drizzle-kit |
| 第5章 | `ch05-r2-kv/` | R2 オブジェクトストレージと KV -- ファイル管理とキャッシュ | R2, KV, TTL, セッション管理 |
| 第6章 | `ch06-auth-security/` | 認証とセキュリティ -- JWT, CORS, レート制限 | hono/jwt, CORS, PBKDF2, KV レート制限 |
| 第7章 | `ch07-blog-api/` | プロジェクト実践 ブログ API (統合プロジェクト) | D1 + R2 + JWT, マルチファイル構成 |
| 第8章 | `ch08-saas-mvp/` | プロジェクト実践 SaaS MVP バックエンド | Durable Objects, Queues, API キー認証 |
| 第9章 | `ch09-workers-ai/` | Workers AI -- エッジで AI 推論を動かす | Llama 3.1, DistilBERT, M2M-100, LLaVA |
| 第10章 | `ch10-testing-cicd/` | テスト・CI/CD・本番運用 | Vitest, Workers pool, GitHub Actions |

## 動作要件

- **Node.js** 22 以上
- **Cloudflare アカウント** (無料プランで動作します)
- **Wrangler CLI** (`npm install -g wrangler`)

## クイックスタート

```bash
# リポジトリをクローン
git clone https://github.com/driftnode986/hono-cloudflare-workers-samples.git
cd hono-cloudflare-workers-samples

# 任意の章ディレクトリに移動
cd ch01-hono-basics

# 依存パッケージをインストール
npm install

# ローカル開発サーバーを起動
npm run dev
```

ブラウザまたは curl で `http://localhost:8787/` にアクセスして動作を確認してください。

各章ごとにバインディング (D1, R2, KV 等) のセットアップが必要な場合があります。詳細は各章の README.md を参照してください。

## 主要ライブラリのバージョン

- **Hono** `^4.7.0`
- **Wrangler** `^4.14.0`
- **Drizzle ORM** `^0.45.0`
- **Vitest** `^3.2.0`
- **Zod** `^3.24.0`
- **TypeScript** `^5.7.0`
- **@cloudflare/workers-types** `^4.20250525.0`
- **@cloudflare/vitest-pool-workers** `^0.8.0`

## ライセンス

MIT License -- 詳細は [LICENSE](LICENSE) を参照してください。

## 書籍の購入

Amazon Kindle ストアで購入できます。

https://www.amazon.co.jp/dp/B0H37LKTTN
