# 模型与接口参考

本文档汇总本项目使用的所有 AI 模型、接口、定价、能力边界。
**所有模型相关的决策与实现必须先来这里查，不要凭记忆写代码。**

最近更新：2026-05-25（已实测确认网关 base URL + 模型路由）

---

## 0. 接入方式总览

**重要**：本项目使用的是**小米内部 LLM 网关**（LiteLLM 风格代理，OpenAI API 兼容）——不是直连 OpenAI 官方。

- API Key：在 `.env` 的 `OPENAI_API_KEY`（小米网关下发，sk-XXX 格式）
- Base URL：`https://api.llm.mioffice.cn/v1`（已实测确认，写在 `.env` 的 `OPENAI_BASE_URL`）
- 模型名格式：`provider/model` LiteLLM 风格——**LLM 和图像都必须加前缀**
  - 实测：`gpt-5.5` / `gpt-image-2` 都返回 400 "Not supported model"
  - 必须用：`azure_openai/gpt-5.5`、`azure_openai/gpt-image-2`
  - `/v1/models` 列表里看到的 `id` 是底层模型名，**不是**调用名，别被误导
- 健康检查：`GET https://api.llm.mioffice.cn/v1/models`，带 Bearer key 应返回 200 + 模型列表

**官方文档**（飞书 wiki，需小米账号登录）：
- LLM 接入：https://mi.feishu.cn/wiki/MvCiwodp1i0XIMkaXqVcQIS9nRf
- 图像生成：https://mi.feishu.cn/wiki/DqwtwHIaqiiWMZkyqh6ce7Nynth

**调用方式**：使用 `openai` 官方 SDK 即可，构造 client 时传 base_url 即可指向小米网关。SDK 调用语法跟 OpenAI 官方完全一致。

---

## 1. LLM：故事与分镜

### azure_openai/gpt-5.5（项目主力）

- **角色**：Story Brain（故事生成）+ Storyboard Planner（分镜规划）
- **网关模型名**：`azure_openai/gpt-5.5`（注意有 `azure_openai/` 前缀，这是网关路由约定）
- **API 端点**：标准 OpenAI 兼容 `POST /v1/chat/completions`
- **结构化输出**：支持 `response_format: {type: "json_schema"}`
- **底座**：GPT-5.5 是 OpenAI 4.5 之后首个完全重训的基模，1M 上下文，强长链路一致性
- **是 reasoning 模型**：响应里有 `reasoning_tokens` 字段。`max_tokens=10` 实测全部被推理消耗，正文为空。**所以 `max_completion_tokens` 必须给足**（故事生成至少 4000+，分镜至少 8000+），否则返回空内容
- **本项目用法**：
  - 输入"生活小事 + 教育目标 + CharacterBible 摘要 + 8 页结构要求"
  - 输出严格 schema 校验过的 Story JSON / Page JSON

### 调用代码模板（Node SDK）

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,  // 小米网关地址
});

const res = await client.chat.completions.create({
  model: process.env.LLM_MODEL || 'azure_openai/gpt-5.5',
  messages: [...],
  response_format: { type: 'json_schema', json_schema: { ... } },
});
```

### 模型切换原则

LLM 在本项目设计为**热插拔**——通过环境变量切换，不改业务代码。每个 pipeline 步骤（Story Brain / Storyboard Planner / Image Prompt Compiler）可独立指定模型。

---

## 2. 图像：gpt-image-2

### 关键事实（架构地基）

- **发布**：2026-04-21（OpenAI 第三代图像模型，gpt-image-1 → 1.5 → 2）
- **API 端点**：
  - `POST /v1/images/generations` —— 纯文生图
  - `POST /v1/images/edits` —— **图生图 / 多参考图 / 编辑**（本项目核心用法）
  - Responses API 内联调用 —— 多轮对话场景（暂不用）
- **本项目核心能力确认**：
  - ✅ `images.edit` **支持一张或多张 reference image** + prompt
  - ✅ 支持 mask inpainting / outpainting
  - ✅ 所有图像输入自动以 high fidelity 处理（无需 `input_fidelity` 参数）
- **新特性**：首个 "Agentic" 图像模型——生成前会自主规划、推理画面结构

### 定价（token-based）

| 类型 | 价格 |
|---|---|
| Text input | $5.00 / 1M tokens |
| Cached text input | $1.25 / 1M tokens |
| Image input | $8.00 / 1M tokens |
| Cached image input | $2.00 / 1M tokens |
| Image output | $30.00 / 1M tokens |

Batch 模式半价。

**单张图片估算**（1024×1024）：

| 质量 | 输出成本 |
|---|---|
| Low | ~$0.006 |
| Medium | ~$0.053 |
| High | ~$0.211 |

矩形 1024×1536 略便宜：$0.005 / $0.041 / $0.165。

**注意**：edits 端点带 reference images 时，input image tokens 会显著增加（因为高保真处理），实际单张可能比上表高 30-50%。

### 单本绘本图像成本估算

假设：8 页 + 角色定妆 1 张 = 9 张主图，每张 high quality + 1 张 reference image，平均 50% re-roll 率。

- 主图：9 × 1.5 × $0.21 ≈ **$2.84**
- LLM：可忽略（< $0.05）
- **单本总成本：约 $3**

### 角色一致性能力（实战注意）

社区实测："character-consistency 在简单主体上稳定，场景复杂度提高时变弱"。所以本项目设计：

- 必须依赖人工审核 + per-page re-roll
- 不能假设"扔进去就是水水"，需要 prompt 中显式重复 character lock
- 复杂场景（多角色 / 强动作 / 远景小人物）re-roll 率会更高

### 本项目用法（通过小米网关）

```typescript
import OpenAI from 'openai';
import fs from 'fs';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,  // 小米网关
});

const res = await client.images.edit({
  model: 'azure_openai/gpt-image-2',
  image: [
    fs.createReadStream('assets/bible/character_refs/shuishui_front.png'),
    fs.createReadStream('assets/bible/character_refs/shuishui_expressions.png'),
  ],
  prompt: compilePrompt(styleBible, characterLock, pageDescription),
  size: '1024x1024',
  quality: 'high',
  n: 1,
});

// res.data[0].b64_json → decode and save
```

### 降级方案（如果 gpt-image-2 在某场景拉胯）

1. 切到 `gpt-image-1.5`（$32/1M output，稳定成熟）
2. 切到 `gpt-image-1`（最老最稳）
3. 加 prompt 中的角色描述精度
4. 二期：接外部 IP-Adapter / ControlNet（复杂但效果上限高）

---

## 3. 搜索：Tavily

- **用途**：项目实现过程中，查模型文档、API 变更、技术资料
- **API**：`POST https://api.tavily.com/search`
- **认证**：API key（存在 `.env` 的 `TAVILY_API_KEY`）
- **关键参数**：
  - `query`：搜索词
  - `max_results`：默认 5，可调到 10
  - `search_depth`：`"basic"` 或 `"advanced"`（推荐用 advanced 拿权威源）
  - `include_domains` / `exclude_domains`：限定/排除站点
- **示例调用**：
  ```bash
  curl -X POST https://api.tavily.com/search \
    -H "Content-Type: application/json" \
    -d '{"api_key":"'$TAVILY_API_KEY'","query":"...","max_results":5,"search_depth":"advanced"}'
  ```

---

## 4. 模型选型决策表（本项目当前生效）

| Pipeline 步骤 | 模型（通过小米网关）| 备注 |
|---|---|---|
| Story Brain | `azure_openai/gpt-5.5` | 1M 上下文，长链路稳定性最强 |
| Storyboard Planner | `azure_openai/gpt-5.5` | 同上 |
| Image Prompt Compiler | `azure_openai/gpt-5.5` 或纯模板拼装 | 大部分情况模板够用 |
| Image Generation | `gpt-image-2` | edit 端点 + multi-reference 输入 |
| Web 搜索 | Tavily（独立 key） | — |

---

## 维护规则

- **新增模型/接口** → 加到本文档对应章节
- **价格变动** → 更新表格，标注更新日期
- **能力边界变化**（比如 gpt-image-2 突然支持视频）→ 更新"关键事实"
- **踩坑/降级经验** → 加到对应模型的"实战注意"段落
- 文档顶部"最近更新"日期保持新鲜

写代码前先查这里。这里没有的事实先用 Tavily 查证，查到就回写本文档。
