# 封面生成指南

## 核心目标

封面不是普通内页,而是“儿童绘本封面 / 动画电影海报标题卡”。标题必须同时满足:

- **拼写正确**: 英文标题逐字正确,不能乱码、漏字、多字。
- **缩略图可读**: 手机书架小卡片上也要看清。
- **主题定制**: 字体氛围来自故事核心意象,不能每本都套同一种字体。
- **角色一致**: 封面必须和内页一样遵守角色圣经,不能手写简化服装导致漂移。

## Prompt 结构

按 OpenAI 图像指南的结构写,不要一段话糊在一起:

```text
INTENDED USE
Premium vertical children's picture-book cover / modern animated feature-film poster title card.

TITLE TREATMENT
Render exactly this title and no other text: "...".
位置、大小、可读性、字体材质、主题装饰、禁止项。

CHARACTER VISUAL LOCKS
从 assets/bible/characters/*.yaml 注入 prompt_anchor。

COVER SCENE
只写构图、动作、地点、故事元素;不要在这里重写角色服装。

STYLE / MOOD
现代影院级 3D 动画长片美学、光影、色彩、情绪。

HARD CONSTRAINTS
拼写、无额外文字、角色锁、无真人。
```

## 标题字体写法

优先描述“好字应该是什么”,再少量排除坏方向。

推荐关键词:

- `large SOLID rounded storybook letters`
- `thick readable strokes`
- `crisp clean edges`
- `high contrast`
- `careful kerning`
- `readable at phone thumbnail size`
- `max two lines`
- `decorative motifs around or on letter edges, never distort letter shapes`

避免低可读性关键词:

- `watercolor wash`
- `translucent letters`
- `thin brush script`
- `color bleeding`
- `scribbly crayon`
- `messy rainbow marker`
- `stitching / thread / yarn / needlework`

## 主题化字体例子

### 池塘 / 小鸭子 / 金鱼

```text
large SOLID rounded storybook letters with cream-and-golden letter faces like sunlit bread crumbs and smooth pond pebbles; subtle polished 3D bevel; turquoise water-ripple underline; tiny duck-feather edge accents, orange-gold fish bubbles, and small leaf motifs around the letters; decorations never distort the spelling.
```

### 海边 / 度假

```text
large SOLID rounded sandy letters, warm golden sand material, turquoise wave underline, tiny shells and sea foam accents around the letter edges; crisp readable silhouettes, not stitched, not yarn, not watercolor bleeding.
```

## 工作流规则

1. 生成封面时必须传 `CHARS=shuishui,papa,...`,让 `make-cover.mjs` 自动注入角色圣经。
2. `SCENE` 只写动作/构图/场景,不要手写“爸爸穿白 T”这类角色设定。
3. 每次生成 3 张候选，默认 3 选 1，兼顾质量和效率。
4. 选择标准排序:
   - 标题拼写和可读性
   - 封面构图是否平衡(标题不能压倒主体)
   - 角色圣经是否遵守
   - 故事主题元素是否准确
5. 未经用户确认,不要把实验封面直接发布。

## Duck Pond Day 测试结论

失败原因: 使用 `TITLE_STYLE=watercolor` 导致标题变软、渗化、缩略图可读性差;封面脚本未注入角色圣经,导致爸爸服装靠手写 SCENE 漂移。

修正方向: 用结构化 cover brief + `CHARS=shuishui,papa` 注入角色视觉锁 + “池塘主题实心标题字”。最终用户选择第 2 张,因为第 1 张标题过强且三行排版导致构图失衡。
