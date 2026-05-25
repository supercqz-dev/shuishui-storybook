# 水水的绘本 📚

为 3.5 岁女儿"水水"做的私人绘本生成工具。每天的小事 → AI 编故事 → AI 配图 → 一本属于她的绘本。

## 这是什么

- **本地创作**：在自己的 Mac 上跑 Next.js，输入"今天发生的小事" + "希望她学到什么"，AI 生成 8 页绘本
- **公开分享**：成品推到 GitHub，自动部署到 GitHub Pages，长辈用手机扫码就能看
- **角色固定**：水水（兔子）、爸爸（柴犬）、妈妈（小鹿）、姥姥（小熊猫）—— 每本书都是同一家人
- **手机优先**：图片是 1024×1536 竖版，全屏阅读专为竖屏手机设计

## 第一次跑要做什么

### 1. 装依赖

```bash
cd "水水的绘本"
npm install
```

### 2. 配 .env

复制 `.env.example` 到 `.env`，填写：

```
TAVILY_API_KEY=…           # 调研用
OPENAI_API_KEY=…           # 小米网关 key（飞书找内部 LLM 同事拿）
OPENAI_BASE_URL=https://api.llm.mioffice.cn/v1
LLM_MODEL=azure_openai/gpt-5.5
IMAGE_MODEL=azure_openai/gpt-image-2
```

> 模型名必须带 `azure_openai/` 前缀，否则网关返回 400。详见 [docs/MODELS.md](docs/MODELS.md)。

### 3. （可选）生成角色定妆图

水水的定妆图已经在 `assets/bible/character_refs/shuishui.png`。如果要为爸爸/妈妈/姥姥也生成，启动后调用：

```bash
curl -X POST http://localhost:3000/api/generate-character-ref/ \
  -H 'content-type: application/json' \
  -d '{"character_id":"papa"}'
```

每张约 $0.21。

> 注：当前小米网关的 `/v1/images/edits` 路由没启用，所以定妆图目前**只用于人工核对设定**，不会作为 reference 输入到生成流程里。一致性靠 prompt 里逐字嵌入角色 visual lock 来维持。

### 4. 启动开发服

```bash
npm run dev
```

打开 http://localhost:3000

## 怎么做一本书

1. 首页点 **"+新建一本绘本"**
2. 填两个空：
   - **今天发生的小事**：越具体越好
   - **想让她学到什么**：一句话
3. 选这本书要出场的角色（水水自动选中）
4. 点 **生成故事** —— 30 到 60 秒后出 8 页分镜
5. 每一页可以编辑文字
6. 点每页的 **生成插画** 按钮 —— 每张约 1 分钟
7. 满意了就点 **保存并出版**
8. 阅读器自动打开，点封面进全屏

## 怎么发布到长辈手机上

```bash
git add data/books/ public/generated/
git commit -m "新增：xxx 故事"
git push
```

GitHub Actions 会自动构建 + 部署，1-2 分钟后访问：

```
https://<你的-github-username>.github.io/shuishui-storybook/
```

把这个网址发给老人，他们直接打开就能看。

## 项目结构

```
src/
  app/
    page.tsx              # 书架（首页）
    editor/page.tsx       # 创作器
    books/[id]/page.tsx   # 阅读器入口
    api/                  # 本地开发用 API（构建到 GH Pages 时被剥离）
      generate-story/     # gpt-5.5 出 8 页 JSON
      generate-image/     # gpt-image-2 出单页图
      save-book/          # 把书写到 data/books/
      generate-character-ref/   # 出角色定妆
      characters/         # 列出所有可选角色
  components/
    BookReader.tsx        # 全屏阅读器（左右轻点翻页）
  lib/
    bible.ts              # 加载角色/画风/世界观 YAML
    openai-client.ts      # 小米网关 OpenAI 客户端
    prompt-templates.ts   # 故事/图像 prompt 模板
    story-schema.ts       # gpt-5.5 输出 JSON Schema

assets/
  bible/
    characters/*.yaml     # 角色设定（视觉锁、性格、口头禅）
    style.yaml            # 画风设定（Disney Zootopia 3D）
    world.yaml            # 世界观规则
    character_refs/*.png  # 角色定妆图（人工核对用）

data/
  books/*.json            # 已出版的绘本数据

public/
  generated/<book-id>/page-NN.png  # 生成的插画

scripts/
  build-pages.sh          # GH Pages 构建脚本（剥离 API 后 next export）

.github/workflows/pages.yml  # 推到 main 自动部署
```

## 模型与定价

详见 [docs/MODELS.md](docs/MODELS.md)。一本书的成本：

- 故事生成（gpt-5.5）：~$0.05
- 8 页插画（gpt-image-2 high quality）：~$2.5
- 假设 50% 重 roll 率：**约 $3-4 一本**

## 已知约束

1. **`/v1/images/edits` 在小米网关上未启用** → 没法用多参考图模式锁角色，靠 prompt 描述细节
2. **`gpt-5.5` 是 reasoning 模型** → `max_completion_tokens` 必须给足（故事 8000+）
3. **角色一致性会有 5-15% 的随机漂移** → 每页可单独 re-roll
4. **Tailwind 样式定义在 [tailwind.config.ts](tailwind.config.ts)** —— 改色调直接改 `shuishui-pink` 系列变量

## 未来可能加

- [ ] 跨绘本的"角色一致性档案"（如果哪天网关上线 /edits）
- [ ] PDF 打印导出
- [ ] 给水水自己看的"听绘本"模式（TTS 朗读）
- [ ] 季节/节日主题模板

## 维护规则

- 改任何模型相关的事 → 先看 [docs/MODELS.md](docs/MODELS.md)
- 加新角色 → 在 [assets/bible/characters/](assets/bible/characters/) 加 YAML，跑一次 `/api/generate-character-ref` 出定妆图
- 调画风 → 改 [assets/bible/style.yaml](assets/bible/style.yaml) 的 `prompt_anchor`
