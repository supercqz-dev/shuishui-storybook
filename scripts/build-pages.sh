#!/usr/bin/env bash
# 把创作态目录临时挪走 → next build (static export) → 还原
# Next.js 的 output:'export' 模式不允许:
#   - API 路由 (runtime 不存在)
#   - 没有 generateStaticParams 的 dynamic routes
# 创作器(/editor)和角色管理(/characters)只在本地开发态用,
# 部署到 GH Pages 只展示静态绘本,因此构建前临时摘掉它们。

set -euo pipefail

# 要在构建期摘掉的目录:dev-only,不进生产构建
STASH_PATHS=(
  "src/app/api"
  "src/app/editor"
  "src/app/characters"
)

mkdir -p .pages-stash

cleanup() {
  for p in "${STASH_PATHS[@]}"; do
    stash="$(echo "$p" | sed 's|src/app/||')"
    full=".pages-stash/${stash}"
    if [ -d "$full" ]; then
      mkdir -p "$(dirname "$p")"
      mv "$full" "$p"
      echo "[build-pages] restored $p"
    fi
  done
  rmdir .pages-stash 2>/dev/null || true
}
trap cleanup EXIT

for p in "${STASH_PATHS[@]}"; do
  if [ -d "$p" ]; then
    stash="$(echo "$p" | sed 's|src/app/||')"
    mv "$p" ".pages-stash/${stash}"
    echo "[build-pages] stashed $p"
  fi
done

# NEXT_PUBLIC_BASE_PATH 在客户端组件用来拼图片绝对路径(如 /generated/...)
# 必须跟 next.config.mjs 里的 basePath 一致,否则部署到 GH Pages 子路径后图片 404
GITHUB_PAGES=true NEXT_PUBLIC_BASE_PATH="/shuishui-storybook" npx next build

# Add a .nojekyll so GH Pages doesn't choke on _next/ paths
touch out/.nojekyll
echo "[build-pages] build complete → ./out"
