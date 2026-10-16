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

# 第 8 章の index.ts は app を名前付きでも export している（テストが app.request() で呼ぶため）。写しは完全に同じにする
grep -q '^export const app = ' src/index.ts \
  || { echo "第 8 章の src/index.ts が export const app ではありません" >&2; exit 1; }
