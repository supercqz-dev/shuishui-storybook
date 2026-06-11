# CLAUDE.md — 水水的绘本

> 新会话/切模型后读到这个文件就等于"接上"了。

## 这个项目是什么

为 3.5 岁女儿"水水"做的私人绘本生成工具。每天的小事 → GPT-5.5 编故事 → GPT-image-2 配图 → 8 页绘本。
用户（水水爸爸）不会编程，所有代码由 Claude Code 编写和维护。

## 技术栈

- Next.js (App Router) + Tailwind CSS
- 本地 `npm run dev` 创作，成品推 GitHub → GitHub Actions → **GitHub Pages** 部署
- **Vercel 明确不用**（4.5MB serverless 限制）
- 线上地址：`supercqz-dev.github.io/shuishui-storybook/`

## AI 模型（详细见 docs/MODELS.md）

- 故事 LLM: `azure_openai/gpt-5.5`（小米网关，OpenAI 兼容格式）
- 配图: `azure_openai/gpt-image-2`
- 网关 Base URL: `.env` 里的 `OPENAI_BASE_URL`
- **模型名必须带 `azure_openai/` 前缀**，否则 400
- 改任何模型相关的事 → **先读 docs/MODELS.md**

## 关键脚本

- `scripts/book-runner.mjs` — 全自动一键出书（故事+配图+封面+保存）
- `scripts/make-cover.mjs` — 单独生成/重做封面
- `scripts/build-pages.sh` — GitHub Pages 构建

## 角色设定

所有角色是拟人动物，设定在 `assets/bible/characters/*.yaml`：
- 水水 = 白兔（主角，幼态）
- 爸爸 = 小熊猫（原创拟人形象，红熊猫/Red Panda）
- 妈妈 = 白色兔子
- 姥姥 = 绵羊
- 大姨 = 白色北极熊
- 毛毛（柳絮精灵）= 蒲公英绒球小精灵

画风设定：`assets/bible/style.yaml`（Disney Zootopia 3D CGI）
世界观：`assets/bible/world.yaml`

## 硬性规则（违反会被纠正）

1. **永远不出现真人** — 所有角色/路人都是拟人动物
2. **图像 prompt 禁止写人类年龄或亲属词**（不写"3岁/爸爸/妈妈"，用"幼态/年轻男性/年长女性"）
3. **书名必须是简短英文**（绘本风格），附一行中文副标题；不要写 "ShuiShui"
4. **封面标题字体风格跟故事主题匹配**（水彩/蜡笔/气球字等），不要统一一种
5. **只用顶级全球模型**（OpenAI/Anthropic/Google），禁用国产模型（豆包/通义/Kimi 等）
6. **生成图片后必须 Read PNG 让用户在聊天里看到**，不要只报路径
7. **图片产出后要跑 WebP 转换**（toWebp pipeline），否则手机端太大
8. **发布前删除生成的 PNG，只保留 WebP**（封面和内页都一样；PNG 只用于聊天里检查/临时返工）

## 项目结构速查

```
src/app/page.tsx            — 书架首页
src/app/editor/page.tsx     — 创作器
src/app/books/[id]/page.tsx — 阅读器
src/app/api/                — 本地 API（generate-story, generate-image, save-book 等）
src/lib/                    — openai-client, prompt-templates, bible, story-schema
assets/bible/               — 角色/画风/世界观 YAML
data/books/*.json           — 已出版绘本（目前 12 本）
public/generated/<id>/      — 插画 PNG
scripts/                    — 自动化脚本
```

## 出书流程（最常做的事）

1. 用户给"今天发生的事" + "想教什么"
2. 跑 `book-runner.mjs` 或手动走 API：故事 → 配图 → 封面 → 保存
3. 检查生成的图（Read 显示），有问题重 roll 单页
4. 图片全部转 WebP；确认无误后，发布前删除生成的 PNG，只保留 WebP
5. `git add + commit + push` → 自动部署到 GitHub Pages
6. 推完后确认 Actions 绿了

## 当前状态

- 12 本绘本已出版并在线
- 图片全部转过 WebP（328MB PNG → 35MB WebP）
- 最近一本：willow-catkins（2026-06-10）
