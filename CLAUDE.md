# CLAUDE.md — 水水的绘本

> 新会话/切模型后读到这个文件就等于"接上"了。

## 这个项目是什么

为 3.5 岁女儿"水水"做的私人绘本生成工具。每天的小事 → GPT-5.5 编故事 → GPT-image-2 配图 → 8-22 页绘本。
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

画风设定：`assets/bible/style.yaml`（去品牌化现代影院级 3D 动画长片美学）
世界观：`assets/bible/world.yaml`

## 硬性规则（违反会被纠正）

1. **永远不出现真人** — 所有角色/路人都是拟人动物
2. **图像 prompt 禁止写人类年龄或亲属词**（不写"3岁/爸爸/妈妈"，用"幼态/年轻男性/年长女性"）
3. **书名必须是简短英文**（绘本风格），附一行中文副标题；不要写 "ShuiShui"
4. **封面标题字体风格跟故事主题匹配**（水彩/蜡笔/气球字等），不要统一一种
5. **只用顶级全球模型**（OpenAI/Anthropic/Google），禁用国产模型（豆包/通义/Kimi 等）
6. **生成图片后必须检查 PNG**：白天交互生成时用户会自行看过程；夜间/全自动生成时由代理自行 Read/检查严重画面问题即可，默认不逐张展示给用户，不把展示作为发布阻塞点
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
data/books/*.json           — 已出版绘本（目前 13 本）
public/generated/<id>/      — 插画 WebP（发布后只保留 WebP；JSON 可保留 .png 旧路径由前端兼容转换）
scripts/                    — 自动化脚本
```

## 出书流程（最常做的事）

1. 用户给"今天发生的事" + "想教什么"
2. 跑 `book-runner.mjs` 或手动走 API：故事 → 配图 → 封面 → 保存
3. 检查生成的图（Read 显示），有问题重 roll 单页
4. 图片全部转 WebP；确认无误后，发布前删除生成的 PNG，只保留 WebP
5. `git add + commit + push` → 自动部署到 GitHub Pages
6. 推完后确认 Actions 绿了

### 自主发布要求（重要）

- 用户给完故事大纲后，默认目标是**自主完成整本绘本生成并发布到手机端图书馆可见**，不要停在半流程。
- 标准闭环：LLM 写脚本分镜 → 生成内页 → 用 `scripts/make-cover.mjs` 正确通路生成封面 → 检查 PNG 严重问题 → 对明显错误页面主动重 roll → 转 WebP → 删除 PNG → 保存 JSON → commit + push → 确认 GitHub Pages Actions 绿了。
- **WebP 转换后自动删除 PNG，不需要再问用户确认**；这是本项目既定发布规则。
- 除非涉及改模型、改部署架构、外部破坏性操作、或需要用户审美选择封面候选，否则不要中途等待确认。
- 封面生成必须使用项目沉淀的 `scripts/make-cover.mjs`，首选 `COVER_MODE=story`，并传 `TITLE`、`STORY_THEME`、`SCENE`、`CHARS=shuishui,papa,...` 注入角色圣经；默认 `N=3` 生成 3 张候选后 3 选 1，提升效率；不要绕过脚本直接手写 OpenAI 图片 prompt。`TITLE_STYLE` 默认 `auto`，除非有明确主题预设需求。
- 可用自动发布脚本：`BOOK=xxx PUBLISH=1 node scripts/book-runner.mjs`；已生成/返工后的单本发布用 `BOOK_ID=xxx node scripts/publish-book.mjs`。


## 今日沉淀（2026-06-11）

### 长故事与镜头语言

- 故事 schema 已支持 **8-22 页**：`src/lib/story-schema.ts` 的 `pages.maxItems/page.maximum = 22`；`generate-story` 的 `max_completion_tokens = 24000`。
- 长跨度故事（幼儿园完整一天、旅程、一整天活动）可以扩展到 **15-22 页**，不要硬压成 8 页。
- 镜头语言不能简单理解成“不要一直平视 → 多用俯视”。正确原则：**根据情节规划镜头**。
  - 亲密室内互动：优先 `medium/close-up + eye-level/three-quarter`，看清表情。
  - 空间建立：`wide + eye-level/three-quarter`；只有大空间布局才考虑 `high-angle`。
  - 动作关系：用侧面/三分之四角度拍清谁在做、谁在接受动作。
  - 细节自理（喝水、吃水果、拿玩具）：`close-up + eye-level`。
  - 群体游戏：`wide/medium + eye-level/three-quarter`，让所有角色和动作清楚。
- **首页不要默认俯视**。室内亲密开场尤其不要 high-angle；只有操场/街道/大空间建场才可用。

### 临时服装覆盖角色默认设定

- 如果故事明确说角色穿睡衣、雨衣、运动服等临时服装，`composition_hint` 必须写清楚并覆盖 YAML 默认服装。
- 例：早晨起床页，水水/妈妈/爸爸都穿睡衣时，必须写 `wearing pajamas instead of usual outfit`，并明确不要画默认粉裙/黄花裙。
- 注意睡觉场景的空间关系：如果用户说“水水和妈妈睡一张床”，prompt 必须写 `share the SAME large bed`，不要让模型把妈妈画成站在床边。

### 摩托车/踏板车构图经验

- “弯梁摩托车加装座椅”容易被模型画错成后座、sidecar 或坐车把。
- 如果要求真实结构，优先用 **侧面远景 / three-quarter side view**，不要用航拍；航拍更难看清机械结构。
- 更稳定的描述可以改成：爸爸骑踏板摩托车，水水**站在前方宽踏板上**；镜头在马路对面，拍十字路口/斑马线过马路。
- 关键 prompt：`shuishui stands safely on the scooter's wide flat front footboard / floorboard area in front of the red panda and below the handlebars, NOT on the rear seat, NOT sitting on the handlebars`。

### WebP 与发布规则

- 生成阶段可以有 PNG，因为需要 `Read PNG` 给用户看、方便单页返工。
- **发布前必须删除生成目录里的 PNG，只保留 WebP**（封面和内页都一样）。
- 旧兼容逻辑：前端 `toWebp()` 会把 `/generated/.../*.png` 自动替换成 `.webp`。
- 新书建议：JSON 里可以直接写 `.webp` 路径，更直观；前端继续保留 `toWebp()` 兼容旧书。
- 注意：如果把 PNG 删了，但 JSON 里没有 `image_path`，页面会空白；必须确保每页都有 `image_path`。若 JSON 仍写 `.png`，前端会转 `.webp`。

### 本次新书

- 新增绘本：`kindergarten-day-2026-06-11`
- 标题：`A Busy School Day`
- 副标题：`水水充实又快乐的幼儿园一日生活`
- 页数：22 页
- 发布后目录：`public/generated/kindergarten-day-2026-06-11/`，只保留 `cover.webp` + `page-01.webp` 到 `page-22.webp`。

