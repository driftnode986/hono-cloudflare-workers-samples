# 第6章: 認証とセキュリティ -- JWT, CORS, レート制限

JWT 認証、CORS 設定、KV ベースのレート制限、Web Crypto API によるパスワードハッシュを組み合わせたセキュリティ実装のサンプルです。保護されたルートへのアクセス制御とロールベースの認可も扱います。

## この章で学ぶこと

- `hono/jwt` による JWT トークンの生成 (`sign`) と検証 (`jwt` ミドルウェア)
- `hono/cors` による CORS ミドルウェアの設定 (許可オリジン、メソッド、ヘッダ)
- KV を使ったスライディングウィンドウ方式のレート制限
- Web Crypto API (PBKDF2) によるパスワードハッシュ
- ミドルウェアによる保護ルートの実装パターン
- JWT ペイロードに基づくロールベースの認可 (admin チェック)

## ファイル構成

```
ch06-auth-security/
  src/
    index.ts          # CORS、レート制限、JWT 認証、保護ルート
  package.json
  tsconfig.json
  wrangler.toml       # JWT_SECRET (環境変数)、KV バインディング設定
```

## セットアップ

```bash
npm install

# レート制限用の KV ネームスペースを作成
wrangler kv namespace create RATE_LIMIT

# wrangler.toml の id を返却された値に更新
```

`wrangler.toml` の `JWT_SECRET` は開発用のダミー値が設定されています。本番環境では `wrangler secret put JWT_SECRET` で安全な値を設定してください。

## 実行方法

```bash
npm run dev
```

開発サーバーが `http://localhost:8787` で起動します。以下の curl コマンドで動作を確認できます。

```bash
# ログインして JWT トークンを取得
curl -X POST http://localhost:8787/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"password123"}'

# 取得したトークンを変数に格納
TOKEN="<ログインレスポンスの token 値を貼り付け>"

# 保護されたルートにアクセス (プロフィール取得)
curl http://localhost:8787/api/protected/profile \
  -H "Authorization: Bearer $TOKEN"

# 管理者専用ルート
curl http://localhost:8787/api/protected/admin \
  -H "Authorization: Bearer $TOKEN"

# トークンなしでアクセス (401 エラー)
curl http://localhost:8787/api/protected/profile
```

## 使用する主要 API

- **`sign(payload, secret)`** -- JWT トークンの生成
- **`jwt({ secret })`** -- JWT 検証ミドルウェア
- **`cors({ origin, allowMethods, allowHeaders, maxAge })`** -- CORS 設定
- **`c.get('jwtPayload')`** -- 検証済み JWT ペイロードの取得
- **`c.req.header('CF-Connecting-IP')`** -- クライアント IP の取得 (レート制限のキー)
- **`crypto.subtle.importKey()` / `crypto.subtle.deriveBits()`** -- PBKDF2 パスワードハッシュ

## 本書との対応

本書 第6章「認証とセキュリティ -- JWT・CORS・レート制限」のコードサンプルに対応します。

## 無料枠メモ

この章のサンプルは Cloudflare Workers 無料プランで動作します。レート制限に使用する KV の書き込みはリクエストごとに発生しますが、無料枠 (1K writes/日) の範囲内でローカル開発には十分です。本番環境で大量トラフィックが見込まれる場合は Paid プランを検討してください。
