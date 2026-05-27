# 第7章: プロジェクト実践 ブログ API -- D1 + R2 + JWT の統合

第1章から第6章までの知識を統合し、フル機能のブログ API を構築するプロジェクト実践のサンプルです。マルチファイル構成によるプロジェクト分割、ユーザー登録・ログイン、記事の CRUD、カバー画像のアップロードと配信を扱います。

## この章で学ぶこと

- `routes/` / `db/` / `middleware/` によるプロジェクトのディレクトリ分割
- Drizzle ORM によるリレーション付きスキーマ定義 (`users` テーブルと `posts` テーブル)
- Web Crypto API (PBKDF2) によるパスワードハッシュを含むユーザー登録・ログイン
- `createMiddleware` を使った再利用可能な JWT 認証ミドルウェア
- 認証付き記事 CRUD (公開記事の一覧は認証不要、作成は認証必須)
- R2 へのカバー画像アップロードと Cache-Control ヘッダ付きの画像配信

## ファイル構成

```
ch07-blog-api/
  src/
    index.ts              # アプリのエントリポイント (グローバルミドルウェア、ルートマウント、画像配信)
    db/
      schema.ts           # Drizzle ORM スキーマ (users, posts)
    middleware/
      auth.ts             # JWT 認証ミドルウェア、ロールベース認可 (adminOnly)
    routes/
      auth.ts             # ユーザー登録 (/register) とログイン (/login)
      posts.ts            # 記事 CRUD とカバー画像アップロード
  package.json            # drizzle-orm, drizzle-kit, hono/jwt を含む依存関係
  tsconfig.json
  wrangler.toml           # D1, R2, JWT_SECRET の設定
```

## セットアップ

```bash
npm install

# D1 データベースを作成
wrangler d1 create blog-db

# R2 バケットを作成 (カバー画像用)
wrangler r2 bucket create blog-images

# wrangler.toml の database_id を返却された値に更新

# マイグレーションファイルを生成
npm run db:generate

# ローカル D1 にマイグレーションを適用
npm run db:migrate
```

`wrangler.toml` の `JWT_SECRET` は開発用のダミー値が設定されています。本番環境では `wrangler secret put JWT_SECRET` で安全な値を設定してください。

## 実行方法

```bash
npm run dev
```

開発サーバーが `http://localhost:8787` で起動します。以下の curl コマンドで一連の操作を確認できます。

```bash
# ヘルスチェック (利用可能なエンドポイント一覧)
curl http://localhost:8787/

# ユーザー登録
curl -X POST http://localhost:8787/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"author@example.com","password":"password123","name":"Author"}'

# ログイン (JWT トークン取得)
curl -X POST http://localhost:8787/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"author@example.com","password":"password123"}'

# 取得したトークンを変数に格納
TOKEN="<ログインレスポンスの token 値を貼り付け>"

# 記事を作成 (認証必須)
curl -X POST http://localhost:8787/posts \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"My First Post","slug":"my-first-post","body":"Hello from Blog API!","status":"published"}'

# 公開記事一覧を取得 (認証不要)
curl http://localhost:8787/posts

# 記事をスラッグで取得
curl http://localhost:8787/posts/my-first-post

# カバー画像をアップロード (認証必須)
curl -X POST http://localhost:8787/posts/1/cover \
  -H 'Content-Type: image/jpeg' \
  -H "Authorization: Bearer $TOKEN" \
  --data-binary @path/to/image.jpg
```

## 使用する主要 API

- **`app.route('/auth', authRoutes)`** -- ルートファイルのマウント
- **`createMiddleware<Env>()`** -- 型安全なカスタムミドルウェアの作成
- **`sign(payload, secret)`** -- JWT トークン生成
- **`references(() => users.id)`** -- Drizzle ORM のリレーション定義
- **`object.writeHttpMetadata(headers)`** -- R2 オブジェクトのメタデータを HTTP ヘッダに反映
- **`c.set()` / `c.get()`** -- ミドルウェア間のコンテキスト変数の受け渡し

## 本書との対応

本書 第7章「プロジェクト実践 -- ブログ API とマークダウンレンダラー」のコードサンプルに対応します。

## 無料枠メモ

この章のサンプルは Cloudflare Workers 無料プランで動作します。D1 (5M reads/日)、R2 (10GB ストレージ)、JWT 認証 (Workers の演算で処理) はいずれも無料枠内です。個人ブログ規模の運用であれば無料枠で十分まかなえます。
