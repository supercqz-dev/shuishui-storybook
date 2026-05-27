# 水水的绘本 — 产品需求文档

最后更新：2026-05-27
版本：v2 (基于 2026-05-25 init 的当前迭代)

---

## 1. 产品定位

**一个本地运行、静态发布的儿童绘本生成器。父母用日常生活小事（"今天水水不肯吃菜"）做 trigger，AI 生成 8 页配图绘本，发布到一个公开的 GitHub Pages URL，全家人手机一刷就能给孩子讲。**

不是一个 SaaS，不是 PaaS，没有用户系统，没有付费层。是一对一的家庭工具——用户在自己 Mac 上创作，在自己的 GitHub 仓库发布，通过 GitHub Pages 的免费托管让产物对妻子/孩子可见。

---

## 2. 用户与使用场景

### 主用户

- 一位不会编程的爸爸（项目主用户）
- 妻子：作为读者使用阅读端
- 3.5 岁女儿水水：实际故事消费者

### 核心使用场景

每天晚上爸爸花 5-10 分钟，把当天家里发生的小事（吃菜、午睡、害羞、学新技能）写成 trigger，加一个想让女儿学到的道理（教育目标），生成一本 8 页绘本，发到 GitHub Pages。第二天妻子或自己可以从手机刷给女儿看。

### 关键约束（来自用户）

1. **用户不会编程**——任何创作流程必须 GUI 化（已落地：本地 web UI）；任何运维必须最简（已落地：git push 触发自动部署）
2. **零成本**——不接付费托管/付费部署。GH Pages 免费、本地 OpenAI API 调用走小米内部网关
3. **API key 不能泄漏**——永远不进部署、永远不进 git commit
4. **拟人动物世界观固定**——参考 Zootopia 风格，4 角色（水水/爸爸/妈妈/姥姥）已锁

---

## 3. 架构 & 硬性原则

### 3.1 双态架构

```
┌─ 创作态（本地 Mac，npm run dev）───────────────────────┐
│  浏览器 → localhost:3000 → Next.js dev 跑全部 API     │
│         → API 路由调 OpenAI（小米网关，key 在 .env）   │
│         → 生成产物落到 data/books/, public/generated/ │
│         → git push 触发 GH Actions                    │
└────────────────────────────────────────────────────────┘
                         ↓
┌─ 发布态（GitHub Pages，公开 URL）──────────────────────┐
│  scripts/build-pages.sh 临时摘掉 src/app/api/         │
│   → next build (output: 'export') 静态导出到 out/     │
│   → 部署到 https://<user>.github.io/<repo>/           │
│   → 公开访问，但不能创作（无 API、无 key）            │
└────────────────────────────────────────────────────────┘
```

### 3.2 硬性原则（HARD RULES）

| # | 规则 | 理由 |
|---|---|---|
| H1 | **禁用 Vercel / Netlify / Cloudflare Workers 等 serverless 平台** | v1 在 Vercel 上踩过 4.5MB serverless function 上传上限（生成图片超限），用户明确不接受。serverless cold-start 也伤害图片密集应用 |
| H2 | **必须 GitHub Pages 静态发布** | 免费、CDN、零运维。`output: 'export'` 模式 |
| H3 | **API key 永不部署** | `.env` 在 .gitignore；构建脚本 `build-pages.sh` 临时摘掉 `src/app/api/` 才 build |
| H4 | **创作只能本地** | 部署后没有 API 路由，没有创作能力，纯静态阅读 |
| H5 | **画面风格锁死**：现代 3D 拟人动物（Zootopia / Pixar 范式） | 已写进 `assets/bible/style.yaml` 的 `prompt_anchor`；不接受真人、不接受 2D 漫画 |
| H6 | **禁止覆盖 canonical 图** | 生成脚本只能写 `iterations/<date>-<topic>/`，canonical 升级必须人工 cp。详见 [character_refs/CONVENTIONS.md](../assets/bible/character_refs/CONVENTIONS.md) |
| H7 | **只用 OpenAI / Anthropic / Google 顶级前沿模型**，不用 lite/flash/turbo 变体；不用国产模型 | 本项目已锁 gpt-5.5（LLM）+ gpt-image-2（图） |

### 3.3 模型选型（写在 [docs/MODELS.md](MODELS.md)）

| 用途 | 模型 | 走哪 |
|---|---|---|
| 故事 + 分镜 | `azure_openai/gpt-5.5` | 小米网关 LiteLLM 风格代理 |
| 图像生成 | `azure_openai/gpt-image-2` | 同上，images.generate 端点 |
| Web 搜索（开发期）| Tavily | 独立 API key |

---

## 4. 功能需求

### 4.1 创作态：故事生成（[/editor](http://localhost:3000/editor)）

#### F-CR-1：故事 trigger 输入
- 字段："今天发生的小事"（多行文本，必填）
- 字段："想让她学到什么"（多行文本，必填）

#### F-CR-2：角色挑选
- 列表：从 `assets/bible/characters/` yaml 读取所有角色，显示中文名
- 水水强制选中，不可取消（女主固定）
- 其他角色可勾选

#### F-CR-3：8 页 storyboard 生成
- 调 `/api/generate-story`，输入 trigger + edu_goal + characters
- 输出 strict JSON schema 的 8 页结构：
  - `title`, `subtitle`, `theme`, `moral`
  - 每页：`page`, `narration`, `dialogue`, `shot`, `emotion`, `characters_in_scene`, `scene_state`, `composition_hint`
- 镜头节奏要求：8 页里相同 shot 类型不超过 3 页（已写进系统 prompt）

#### F-CR-4：page 文字编辑
- 用户可在 review 阶段编辑 LLM 生成的每页 narration/dialogue/composition_hint
- 编辑后再渲染，使用编辑后的版本

#### F-CR-5：单页图像生成
- 调 `/api/generate-image`，输入 page + book_id
- 输出落到 `public/generated/{book_id}/page-XX.png`
- prompt 模板自动拼装：style anchor + 该页角色的 prompt_anchor + scene_state + shot/emotion/composition_hint
- 多语言混合 prompt 可接受（mama 中文 anchor、其他英文）

#### F-CR-6：单页重生（应对幻觉/moderation 失败）
- 每页有"生成图"按钮，已生成过也可点
- 重生用 cache-bust（`?t=${Date.now()}`）强制刷新
- 失败时屏幕显示错误信息（含 moderation 详情）

#### F-CR-7：发布
- 调 `/api/save-book`，写 `data/books/{id}.json`
- 用户后续 git commit + push 触发 GH Pages 自动部署

#### F-CR-8（已完成的辅助工具）
- `scripts/demo-story.mjs`：命令行端到端，方便代理（Claude）批量代跑

### 4.2 阅读态：手机阅读器（[/books/[id]](http://localhost:3000/books/demo-2026-05-27-veggies)）

#### F-RD-1：全屏竖图阅读
- 1024×1536 portrait，`object-contain` 完整显示（手机贴边、桌面有黑边）
- 黑色背景

#### F-RD-2：手势翻页
- 左滑下一页 / 右滑上一页
- 点击中部切换 chrome（标题/页码）显示

#### F-RD-3：文字叠加
- 每页底部半透明黑渐变蒙版叠加 narration + dialogue
- 文字 5 秒后自动隐去（保持图安静）

#### F-RD-4：首页书架
- `/` 列出所有 `data/books/*.json`
- 显示书封面（暂用 page-01）+ 标题 + 副标题

### 4.3 角色档案管理（Bible）

#### F-BB-1：角色定义
- 每个角色一个 `assets/bible/characters/{id}.yaml`
- 字段：基础信息、动物拟人设定、视觉外观、性格、喜好、`prompt_anchor`（图像生成锚点）

#### F-BB-2：canonical 角色定妆图
- `assets/bible/character_refs/{id}.png` —— 当前定稿
- 通过 `/api/generate-character-ref` 生成（dev 环境）
- canonical 升级必须人工 cp，脚本只能写到 iterations 目录

#### F-BB-3：iterations 历史
- `assets/bible/character_refs/iterations/<date>-<topic>/` —— 每轮试错产出
- 含 png + log.txt（含 prompt + moderation 状态）

#### F-BB-4：风格锚点（全局）
- `assets/bible/style.yaml` —— Pixar/Zootopia 风格统一描述
- 每次图像生成前 prepend 到 prompt

#### F-BB-5：世界观锚点
- `assets/bible/world.yaml` —— 拟人动物现代家庭（无 Zootopia 物种张力剧情）

### 4.4 发布与部署

#### F-DP-1：本地构建静态版
- `scripts/build-pages.sh` 临时摘 `src/app/api/` → next build → `out/`
- `next.config.mjs` 通过 `GITHUB_PAGES=true` 切换 `output: 'export'`

#### F-DP-2：GH Actions 自动部署
- `.github/workflows/pages.yml` 监听 push main → 跑 build-pages.sh → upload artifact → deploy
- ~2-3 分钟出结果

#### F-DP-3：阅读地址
- `https://supercqz-dev.github.io/shuishui-storybook/`
- 支持 `/books/{id}/` 静态路由（通过 `generateStaticParams` 列已存在 books）

---

## 5. 非功能需求

### 5.1 性能 / 时延

| 操作 | 目标 | 当前实测 |
|---|---|---|
| 故事生成（8 页） | <60s | ~25s |
| 单页图生成 | <240s | ~3-4 min（含 1 次内部 retry） |
| 8 页全本生成 | <30 min | ~25-30 min（无失败） |
| GH Pages 部署 | <5 min | ~2-3 min |

### 5.2 成本

| 项 | 单本 | 月度（5 本） |
|---|---|---|
| LLM (gpt-5.5) | <$0.05 | <$0.25 |
| 图像 (gpt-image-2 high quality) | ~$3 (8 页 + retry) | ~$15 |
| 托管 (GH Pages) | $0 | $0 |
| **合计** | **~$3** | **~$15** |

### 5.3 内容安全（moderation）

详见 [docs/PROMPT_GUIDE.md](PROMPT_GUIDE.md) §4.5。

**已知 Azure DALL-E 安全过滤特性：**
- 三层过滤（关键词黑名单 / 语义分类器 / 视觉分类器），任何一层命中返回 `moderation_blocked`
- **跨日不可重复**——同一 prompt 不同日子结果不同（Microsoft 官方确认是概率性 ML 分类器）
- 高危词组合：`bunny + adult woman + dress`（已实测）、`mom/adult/mother` + 拟人女性、暴露描述、版权角色名

**应对策略（已落地）：**
- mama 角色 prompt 用中文 + 避开 `bunny`/`adult` 等触发词
- 每页生成失败自动重试 ≤3 次
- 单页 UI 重生按钮兜底偶发失败和模型幻觉

### 5.4 角色一致性

- 每页 prompt 自动拼装 `IMPORTANT FRAMING` + style anchor + 当页角色的 prompt_anchor + scene
- canonical refs 不直接喂给生成（用户网关 image-edit 端点不支持），靠文本 anchor 重复保持一致
- 实测 8 页 demo book 角色一致性高（水水 5 视图、妈妈 5 视图都稳定）

---

## 6. 不在范围内（明确不做）

- 多用户系统、登录、收藏夹
- 评论、社交、分享卡片
- 付费 / 订阅
- 移动 App（手机浏览器够用）
- 真人头像 / 真实摄影
- 视频 / 音频 / 配音（暂时纯图文）
- 自动化 CI 跑生成（每本必须人工 review，不接受全自动出书）
- 其他孩子/家庭复用（这就是水水一家的工具）

---

## 7. 已知约束 / 风险

| 项 | 描述 | 缓解 |
|---|---|---|
| Azure 安全过滤偶发 | 同 prompt 跨日通过率不稳 | 每页 ≤3 次自动重试 + 单页人工重生按钮 |
| 模型幻觉 | 偶发"脚上桌"/服装变形等 | 单页重生 |
| Portrait 比例 + chibi 特征 | 多角色 wide shot 实际偏紧 | 本期接受；未来可在 prompt-templates 加更明确 framing 规则 |
| API key 安全 | 永远不进 git/部署 | .gitignore 严控；build-pages.sh 摘 API |
| 小米网关稳定性 | 偶发 502/超时 | 每次 API 调用本身不重试，由上层重试 |
| storyboard LLM 偶尔写出风险词 | 如 `close-up of toddler crying` 触发 moderation | 当前靠 page 重试；未来可加 LLM prompt 后处理过滤层 |

---

## 8. 路线图

### Phase 1（已完成）
- [x] 4 角色 + family 全家福 canonical refs
- [x] 故事 → 8 页 storyboard 流程（gpt-5.5）
- [x] 单页图像生成（gpt-image-2）
- [x] 阅读器 UI（手机优化）
- [x] iterations 工程纪律
- [x] PROMPT_GUIDE 含实战补充
- [x] 端到端 demo 跑通（"水水的三口青菜"）
- [x] GH Pages 自动部署链路

### Phase 2（接下来要做）
- [ ] 覆盖度测试 2-3 个 trigger（午睡困难/害羞/新技能/papa 出场）
- [ ] cover image 生成流程（Book.cover_image 字段已有但没生成路径）
- [ ] shuishui anchor 用中文 prompt 重做（mama 验证中文路线效果更好）
- [ ] 角色 anchor 语言统一（中或英二选一）
- [ ] storyboard composition_hint 防御性后处理（自动剔除高风险词）

### Phase 3（可选优化）
- [ ] LLM 故事 prompt 加风格自定义（"让妈妈说话更温柔"等）
- [ ] 已发布书的目录 UI 加分类（按教育目标 / 按角色）
- [ ] dev 阶段加预览模式（生成中实时显示进度）
- [ ] 历史 book 的 re-render 流程（角色 anchor 改动后批量重出旧书）

### 不做
- 见 §6

---

## 9. 决策日志

| 日期 | 决策 | 理由 |
|---|---|---|
| 2026-05-25 | v2 init，确定 Next.js + GH Pages 双态架构 | 复用 v1 验证过的部署链路 |
| 2026-05-26 | mama prompt 改用 `long upright pointy ears` 替代 `bunny` | Azure 安全过滤拦 9 次后实测唯一可绕路径 |
| 2026-05-27 | mama 改用中文 prompt + 接受灰色不是纯白 | 用户提供的 GPT 中文 prompt 出图质量明显优于英文，绕过更多 Layer 1 关键词 |
| 2026-05-27 | 接受 chibi 化的成年角色 + 引入 iterations 备份纪律 | 经过 step-up 实测确认 `adult/mom` 不可绕；不可逆覆盖造成历史丢失，引入纪律防止再发生 |
| 2026-05-27 | BookReader `object-cover` → `object-contain` | 桌面端横屏裁剪问题；手机端不变 |

---

## 10. 关键文档索引

- [docs/MODELS.md](MODELS.md) —— 模型/接口/价格参考
- [docs/PROMPT_GUIDE.md](PROMPT_GUIDE.md) —— 图像生成 prompt 写作指南（§4.5 实战补充）
- [assets/bible/character_refs/CONVENTIONS.md](../assets/bible/character_refs/CONVENTIONS.md) —— canonical/iterations 工程纪律
- [scripts/build-pages.sh](../scripts/build-pages.sh) —— 静态导出脚本
- [.github/workflows/pages.yml](../.github/workflows/pages.yml) —— GH Actions 部署流水线
