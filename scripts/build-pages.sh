#!/usr/bin/env bash
# 把 src/app/api 临时挪走 → next build (static export) → 还原
# Next.js 的 output:'export' 模式不允许带 API 路由（runtime 不存在），
# 但这些路由只在本地开发态用（创作时跑），上线后只展示静态成品。
# 因此 GH Pages 构建前临时摘掉它们。

set -euo pipefail

API_DIR="src/app/api"
STASH_DIR=".pages-stash/api"

cleanup() {
  if [ -d "$STASH_DIR" ]; then
    mkdir -p "$(dirname "$API_DIR")"
    mv "$STASH_DIR" "$API_DIR"
    rmdir .pages-stash 2>/dev/null || true
    echo "[build-pages] restored $API_DIR"
  fi
}
trap cleanup EXIT

if [ -d "$API_DIR" ]; then
  mkdir -p .pages-stash
  mv "$API_DIR" "$STASH_DIR"
  echo "[build-pages] stashed $API_DIR"
fi

GITHUB_PAGES=true npx next build

# Add a .nojekyll so GH Pages doesn't choke on _next/ paths
touch out/.nojekyll
echo "[build-pages] build complete → ./out"
