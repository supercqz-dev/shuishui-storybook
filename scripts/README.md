# scripts/ —— 脚本说明

## 活跃脚本（日常使用）

| 脚本 | 用途 | 用法 |
|---|---|---|
| `book-runner.mjs` | 端到端生成一本绘本(故事→分页→逐页生图,带 moderation 重试/降级);`PUBLISH=1` 时生成成功后自动发布 | `BOOK=childrensday PUBLISH=1 node scripts/book-runner.mjs`(BOOK 见文件内 BOOKS 表;`BOOK=all` 跑全部) |
| `publish-book.mjs` | 发布指定绘本:转 WebP、删 PNG、校验文件、git commit/push、等待 GitHub Pages Actions 成功 | `BOOK_ID=xxx node scripts/publish-book.mjs`;检查用 `BOOK_ID=xxx DRY_RUN=1 SKIP_GIT=1 node scripts/publish-book.mjs` |
| `make-cover.mjs` | 正确封面通路:生成带英文标题的主题化封面候选,自动注入角色圣经;首选 `COVER_MODE=story` | `BOOK_ID=xxx TITLE="Duck Dance Day" CHARS=shuishui,papa COVER_MODE=story STORY_THEME="..." SCENE="..." N=4 node scripts/make-cover.mjs` → 产物落 `experiments/<date>/<book>-cover/` |
| `build-pages.sh` | GitHub Pages 静态构建(构建期临时摘掉 dev-only 的 api/editor/characters 路由) | `bash scripts/build-pages.sh` → 产物 `out/` |

运行生图类脚本前需 `set -a; source .env; set +a` 注入 `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `IMAGE_MODEL`。

## archive/（历史一次性脚本）

`scripts/archive/` 存放早期为单个角色/单个素材调试用的一次性脚本(mama 系列暴力重试、各种 banner/cover 重生、zh-prompt 实验等)。
**仅作留存参考,日常不再运行。** 它们当年的输出路径多指向已废弃的 `assets/.../iterations/`。
如需做新的形象/素材实验,参考 `make-cover.mjs` 的写法,输出请落到 `experiments/<date>/<主题>/`(见 `experiments/README.md`)。
