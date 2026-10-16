# Hono + Cloudflare Workers 実践入門 サンプルコード

書籍「Hono + Cloudflare Workers 実践入門 無料枠で動くフルスタックWebアプリを作る」のサンプルコードです。各章のディレクトリに、本文に掲載したコードを本文と同じファイルパスで置いています。本文のコードが正で、このリポジトリは本文から作っています。

Amazon: https://www.amazon.co.jp/dp/B0H37LKTTN

## 章とディレクトリ

- 第1章 `ch01-hono-basics/` Hono の基礎
- 第2章 `ch02-workers-overview/` Cloudflare Workers の全体像
- 第3章 `ch03-typescript-api/` 型安全な API 設計
- 第4章 `ch04-d1-drizzle/` D1 と Drizzle ORM
- 第5章 `ch05-r2-kv/` R2 と KV
- 第6章 `ch06-auth-security/` 認証とセキュリティ
- 第7章 `ch07-blog-api/` ブログ API
- 第8章 `ch08-saas-mvp/` SaaS MVP
- 第9章 `ch09-workers-ai/` Workers AI
- 第10章 `ch10-testing-cicd/` テスト・CI/CD・運用

## 使い方

```bash
git clone https://github.com/driftnode986/hono-cloudflare-workers-samples.git
cd hono-cloudflare-workers-samples/ch01-hono-basics
npm install
npm run check
```

各章は独立した npm プロジェクトです。依存する版は各章の `package.json` に固定しています(Hono 4.12、Wrangler 4.105、Drizzle ORM 0.45、Zod 4、Vitest 4.1)。D1・R2・KV などのバインディングが必要な章は、各章の README を見てください。

## 動作要件

- Node.js 22 以上
- Cloudflare アカウント(無料プランで動作します)

## ライセンス

MIT License。詳細は [LICENSE](LICENSE) を参照してください。
