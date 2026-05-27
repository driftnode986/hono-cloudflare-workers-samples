# 第4章: D1 データベース -- Drizzle ORM で型安全なデータ操作

Cloudflare D1 (SQLite ベースのデータベース) と Drizzle ORM を組み合わせて、型安全なデータベース操作を行うサンプルです。スキーマ定義、マイグレーション、CRUD 操作の一連の流れを扱います。

## この章で学ぶこと

- D1 データベースの作成とバインディング設定
- `sqliteTable` による Drizzle ORM のスキーマ定義 (カラム型、主キー、ユニーク制約)
- `$defaultFn` によるデフォルト値の自動生成
- Drizzle Kit を使ったマイグレーションの生成と適用 (`generate` / `migrate`)
- `select` / `insert` / `update` / `delete` + `returning()` による CRUD 操作
- `eq()` 演算子を使ったクエリフィルタリング

## ファイル構成

```
ch04-d1-drizzle/
  src/
    index.ts          # スキーマ定義と CRUD ルート
  package.json        # drizzle-orm, drizzle-kit を含む依存関係
  tsconfig.json
  wrangler.toml       # D1 バインディング設定
```

## セットアップ

```bash
npm install

# D1 データベースを作成
wrangler d1 create my-database

# wrangler.toml の database_id を返却された値に更新

# マイグレーションファイルを生成
npm run db:generate

# ローカル D1 にマイグレーションを適用
npm run db:migrate
```

## 実行方法

```bash
npm run dev
```

開発サーバーが `http://localhost:8787` で起動します。以下の curl コマンドで CRUD 操作を確認できます。

```bash
# 記事を作成
curl -X POST http://localhost:8787/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hello D1","body":"Drizzle ORM で型安全な DB 操作","slug":"hello-d1"}'

# 記事一覧を取得
curl http://localhost:8787/posts

# 記事を ID で取得
curl http://localhost:8787/posts/1

# 記事を更新
curl -X PUT http://localhost:8787/posts/1 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Updated Title"}'

# 記事を削除
curl -X DELETE http://localhost:8787/posts/1
```

## 使用する主要 API

- **`drizzle(c.env.DB)`** -- D1 バインディングから Drizzle クライアントを生成
- **`sqliteTable()`** -- SQLite テーブルのスキーマ定義
- **`text()` / `integer()`** -- カラム型の指定
- **`db.select().from(table)`** -- SELECT クエリ
- **`db.insert(table).values(data).returning()`** -- INSERT (挿入結果を返却)
- **`db.update(table).set(data).where(condition)`** -- UPDATE
- **`db.delete(table).where(condition)`** -- DELETE
- **`eq(column, value)`** -- WHERE 条件の等値比較

## 本書との対応

本書 第4章「D1 データベース -- Drizzle ORM で型安全なデータ操作」のコードサンプルに対応します。

## 無料枠メモ

この章のサンプルは Cloudflare Workers 無料プランで動作します。D1 の無料枠 (5M reads/日, 100K writes/日, 5GB ストレージ) は本書のサンプル規模では十分余裕があります。
