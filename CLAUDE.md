# CLAUDE.md — 水水的绘本

> 新会话/切模型后读到这个文件就等于“接上”了。先读本文件，再开始创作或改工程。

## 项目目标

为 3.5 岁女儿“水水”做私人绘本生成工具。用户给一天里的小故事/教育目标，系统生成一本文字+插图绘本，发布到手机端图书馆给水水看。

用户（水水爸爸）不会编程，所有工程维护、生成、发布都由代理完成。**用户给完故事大纲后，默认目标是自主完成整本绘本生成并发布到手机端图书馆可见，不要停在半流程。**

## 技术与部署

- 技术栈：Next.js App Router + Tailwind CSS。
- 本地创作：`npm run dev`。
- 部署：GitHub → GitHub Actions → **GitHub Pages**。
- 线上地址：`https://supercqz-dev.github.io/shuishui-storybook/`。
- **不要用 Vercel**：本项目明确不用 Vercel（4.5MB serverless 限制）。

## 模型规则

详细模型说明见 [docs/MODELS.md](docs/MODELS.md)。改任何模型相关代码或配置前，必须先读该文件。

- 故事 LLM：`azure_openai/gpt-5.5`（小米网关，OpenAI 兼容格式）。
- 配图：`azure_openai/gpt-image-2`。
- 网关 Base URL：`.env` 里的 `OPENAI_BASE_URL`。
- 模型名必须带 `azure_openai/` 前缀，否则会 400。
- 只用顶级全球模型（OpenAI / Anthropic / Google），禁用国产模型（豆包、通义、Kimi 等）和低端 lite/flash/turbo 变体。

## 角色与世界观

所有角色和路人都是拟人动物，设定在 [assets/bible/characters/](assets/bible/characters/)：

- 水水 = 白兔（主角，幼态）
- 爸爸 = 小熊猫 / Red Panda（原创拟人形象）
- 妈妈 = 白色兔子
- 姥姥 = 绵羊
- 大姨 = 白色北极熊
- 毛毛（柳絮精灵）= 蒲公英绒球小精灵

画风设定：`assets/bible/style.yaml`。世界观：`assets/bible/world.yaml`。

## 硬性创作规则

1. **永远不出现真人**：所有角色、老师、同学、路人、服务员、观众都必须是拟人动物。
2. **图像 prompt 禁止写人类年龄或亲属词**：不要写 `3岁 / toddler / baby / child / kid / boy / girl / dad / mom / father / mother / parent / 爸爸 / 妈妈 / 姥姥` 等；用 `shuishui / red panda / taller white rabbit / sheep / small animal classmates` 等视觉描述。
3. **书名必须是简短英文绘本名**：附一行中文副标题；标题不要写 `ShuiShui`，整套系列默认就是她的故事。
4. **封面标题必须有故事主题氛围**：不要固定一种字体风格，不要每本都气球字。
5. **图片生成后要检查**：白天交互时用户会自己看过程；夜间/自动流程由代理自行检查严重问题即可，默认不逐张展示给用户，不把展示作为发布阻塞点。
6. **发布前只保留 WebP**：生成阶段可以有 PNG；转 WebP 后自动删除 PNG，不需要再问用户确认。封面和内页都一样。

## 标准出书闭环

用户给故事大纲后，默认按以下闭环自主执行到完成：

1. 生成故事脚本和分镜（8–22 页；长跨度故事不要硬压成 8 页）。
2. 生成内页图片。
3. 用正确封面通路生成封面（见下节）。
4. 自行检查 PNG 的严重画面问题：真人、角色物种错、角色严重漂移、构图严重错、文字明显错、页面内容和分镜不符。
5. 明显错误页面主动重 roll；不要因为正常审美选择中途停等。
6. 转 WebP（q90），删除 PNG。
7. 保存 JSON，确保每页有 `image_path`，新书建议 JSON 直接写 `.webp`。
8. `git add + commit + push`。
9. 等 GitHub Pages Actions 绿了，再报告完成。

除非涉及改模型、改部署架构、外部破坏性操作，或用户明确要求参与审美选择，否则不要中途等待确认。

## 封面生成规则（非常重要）

封面不是普通内页，而是“儿童绘本封面 / 动画电影海报标题卡”。**必须走项目沉淀的封面脚本，不要绕过脚本直接手写 OpenAI 图片 prompt。**

正确通路：`scripts/make-cover.mjs`

首选参数：

```bash
set -a; source .env; set +a
BOOK_ID=<book-id> \
TITLE="<Short English Title>" \
CHARS=shuishui,papa \
COVER_MODE=story \
STORY_THEME="<一句话故事主题/核心意象>" \
SCENE="<只写封面构图、动作、地点、故事元素；不要重写角色服装>" \
N=3 \
node scripts/make-cover.mjs
```

规则：

- 首选 `COVER_MODE=story`：让 gpt-image-2 根据故事主题把英文标题设计成融入画面的 custom title treatment。
- 必须传 `CHARS=shuishui,papa,...` 注入角色圣经，保持角色一致。
- 默认 `N=3`，生成 3 张候选后 3 选 1，兼顾质量和效率。
- `TITLE_STYLE` 默认 `auto`；除非有明确主题预设需求，不要硬指定。
- 选择标准：标题拼写正确和缩略图可读 > 构图平衡 > 角色一致 > 主题元素准确。
- 详细指南见 [docs/COVER_GUIDE.md](docs/COVER_GUIDE.md)。

## 自动化脚本

- `scripts/book-runner.mjs`：故事 + 内页生成主脚本。可用 `BOOK=xxx PUBLISH=1 node scripts/book-runner.mjs`。
- `scripts/make-cover.mjs`：正确封面生成通路，出 3 张候选。
- `scripts/publish-book.mjs`：发布指定绘本，自动转 WebP、删 PNG、校验、commit/push、等待 GitHub Pages Actions 成功。用法：`BOOK_ID=xxx node scripts/publish-book.mjs`。
- `scripts/build-pages.sh`：GitHub Pages 静态构建。

运行生图类脚本前通常需要：

```bash
set -a; source .env; set +a
```

## 项目结构速查

```text
src/app/page.tsx            — 书架首页
src/app/editor/page.tsx     — 创作器
src/app/books/[id]/page.tsx — 阅读器
src/app/api/                — 本地 API（generate-story, generate-image, save-book 等）
src/lib/                    — openai-client, prompt-templates, bible, story-schema
assets/bible/               — 角色/画风/世界观 YAML
data/books/*.json           — 已出版绘本数据
public/generated/<id>/      — 插画 WebP（发布后只保留 WebP）
scripts/                    — 自动化脚本
```

## 镜头与分镜经验

- 故事 schema 支持 8–22 页；长跨度故事（幼儿园完整一天、旅程、一整天活动）可以扩展到 15–22 页。
- 镜头语言按情节规划，不要机械“多用俯视”。
- 亲密室内互动：优先 `medium / close-up + eye-level / three-quarter`，看清表情。
- 空间建立：`wide + eye-level / three-quarter`；只有大空间布局才考虑 `high-angle`。
- 动作关系：用侧面或三分之四角度拍清谁在做、谁在接受动作。
- 细节自理（喝水、吃水果、拿玩具）：`close-up + eye-level`。
- 群体游戏：`wide / medium + eye-level / three-quarter`，让角色和动作清楚。
- 首页不要默认俯视；室内亲密开场尤其不要 high-angle。

## 临时服装与特殊场景

- 如果故事明确说角色穿睡衣、雨衣、运动服、舞蹈服等临时服装，`composition_hint` 必须写清楚并覆盖 YAML 默认服装。
- 例：睡衣场景写 `wearing pajamas instead of usual outfit`，并明确不要画默认粉裙/黄花裙。
- 睡觉场景如果用户说“水水和妈妈睡一张床”，prompt 必须写 `share the SAME large bed`，避免把妈妈画成站在床边。

## 摩托车 / 踏板车经验

- “弯梁摩托车加装座椅”容易被模型画错成后座、sidecar 或坐车把。
- 要真实结构时，优先侧面远景 / three-quarter side view，不要航拍。
- 更稳定描述：red panda 骑踏板摩托车，shuishui 站在前方宽踏板上。
- 关键 prompt：`shuishui stands safely on the scooter's wide flat front footboard / floorboard area in front of the red panda and below the handlebars, NOT on the rear seat, NOT sitting on the handlebars`。

## WebP 与发布细节

- 发布目录 `public/generated/<id>/` 最终只保留 `cover.webp` 和 `page-XX.webp`。
- 前端 `toWebp()` 仍兼容旧 JSON 的 `.png` 路径，但新书建议 JSON 直接写 `.webp`。
- 删除 PNG 前必须确保对应 WebP 存在；发布脚本会校验。
- 如果 JSON 没有 `image_path`，页面会空白；必须保证每页都有。
