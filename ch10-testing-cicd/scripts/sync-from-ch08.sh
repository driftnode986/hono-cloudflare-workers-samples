#!/usr/bin/env bash
# 第 8 章の SaaS MVP（src/ と migrations/）を、第 10 章のテスト対象として写す。
# 第 10 章の本文には src/ が無く、テストは ../src/index を読む。その中身は第 8 章のアプリ。
# 第 8 章を直したら、このスクリプトを実行して写し直す（手で直さない）。
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=../ch08-saas-mvp

rm -rf src migrations
mkdir src
cp -R "$SRC/src/." src/
rm -rf src/steps
cp -R "$SRC/migrations" migrations

# テストは app.request() で呼ぶので、app を名前付きでも export する。
# 第 8 章の export default { fetch, queue } はそのまま残す。
sed -i.bak 's/^const app = new Hono/export const app = new Hono/' src/index.ts
rm -f src/index.ts.bak
grep -q '^export const app = ' src/index.ts \
  || { echo "src/index.ts に 'const app = new Hono' が見つかりません" >&2; exit 1; }
