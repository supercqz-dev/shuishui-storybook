# 水水的绘本 · gpt-image-2 moderation 诊断材料

> 给 GPT 分析:为什么某些角色组合的页面在 Azure 安全分类器(gpt-image-2 走 Azure 路由)上被频繁拒绝(`moderation_blocked`),建议如何优化 prompt 体系。

---

## 0. 项目背景(请先读)

**这是什么**:一个**完全私人**的儿童绘本生成工具,**只给我自己的女儿(3.5 岁,昵称"水水")看**。不公开发布、不商用、不上架。家庭内部使用,通过 GitHub Pages 给家人(爷爷奶奶、姥姥姥爷、妈妈)分享而已。

**为什么要做**:用日常生活的真实素材(去公园、看蚂蚁、幼儿园亲子活动等)给孩子定制绘本,主角和家人都拟人化成动物角色 — 让孩子在故事里看到"自己"和"自己的家人",建立情感连接、强化生活记忆、传递教育目标(勇敢尝试 / 观察自然 / 亲子合作等)。

**家庭角色拟人化设定(不可改变 — 这是项目的核心)**:
- 水水(我女儿,3.5 岁) → 小白兔
- 爸爸(我,41 岁) → 红狐狸 (Zootopia 里 Nick 那种气质)
- 妈妈(34 岁) → 白兔子 (与水水同物种)
- 姥姥(57 岁) → 绵羊

**约束的优先级(从硬到软)**:
- **硬约束**:水水必须是"小女童拟人化",家人必须有视觉辨识度(让孩子能认出"这是我和我家人")。具体物种和颜色**不是核心**,只要保留"小女童 + 爸爸 + 妈妈 + 姥姥"四口之家的可识别性。
- **可调整(如果有充分理由)**:
  - **物种本身可改** — 如果"红狐狸 + 白兔子"这个组合是触发器,我可以把爸爸改成棕熊/灰狼/其他动物。这不是不可动的设定。
  - **画风可改** — 如果 Zootopia 风格因为是 Disney IP 触发了 Azure 的版权分类器,我可以换成皮克斯通用风 / 梦工厂风 / 别的 3D 动画风格。
  - **服装/配色可改** — shuishui 不一定非要粉色裙子;papa 不一定非要红橙色。
- **不太想动的**:
  - "shuishui-only" 通篇 — 故事核心是亲子互动,通篇只有水水一个人意义不大,只能作为最终兜底。
  - 把水水画成中性人形 — 那就不是"我女儿"了。

**画风设定(当前)**:Disney 《Zootopia》(疯狂动物城,2016)风格的 3D CGI 动画。**用户当时挑这个风格的理由**是"Zootopia 本身就是大型电影公司的合家欢内容,Azure 应该见过类似的训练数据,通过率应该高"。**但用户现在怀疑这反而可能是问题** — 因为 Zootopia 是 Disney 受版权保护的 IP,且原作里"狐狸 Nick + 兔子 Judy"是核心 CP,Azure 可能对"狐狸 + 兔子 + Zootopia 风格"这个组合有专门的 IP 触发器。**请重点评估这个假设。**

**技术栈**:
- 本地 Mac 跑 Next.js + 用脚本批量生成 → 静态发布到 GitHub Pages
- 图像模型 = `gpt-image-2`,通过小米内部网关路由到 Azure(所以受 Azure 安全分类器约束,不是 OpenAI 直接的 moderation)
- 我本人**不会编程**,大部分代码是 Claude Code 帮我写的,所以建议尽量给"我能照着改的具体方案",而不是"你应该重构架构"

**给 GPT 的请求**:基于上述约束,分析为什么 shuishui+papa 这个组合频繁被 Azure 拒,并给出**保留家庭设定**前提下可执行的 prompt 优化方案。

---

## 1. 项目工作流程

### 1.1 架构
- **本地 Next.js** + 静态 GH Pages 发布 (无服务器,所有图像在本地一次性生成,纳入 `public/generated/<book_id>/`)
- 模型:
  - **故事生成**:OpenAI `gpt-5` (走小米网关,JSON Schema structured output)
  - **图像生成**:`gpt-image-2` (走小米网关 → Azure 路由,自带 Azure 安全分类器)

### 1.2 单本书生成 pipeline (book-runner.mjs)

```
[STEP 1] generate-story
    ├─ trigger (生活素材) + education_goal + 角色列表
    ├─ system prompt = world.yaml + 选中的 character bibles
    ├─ 输出 = JSON Schema 强约束的 storyboard
    │      title, subtitle, theme, moral
    │      pages[8-15] {
    │        page, narration, dialogue,
    │        shot ∈ {wide, medium, close-up, extreme-close-up},
    │        emotion,
    │        characters_in_scene[<=2],     ← 硬性 cap (避免 3 人同框 100% 触发)
    │        scene_state{location, weather, time_of_day, props[]},
    │        composition_hint              ← 英文一句构图(高风险来源)
    │      }
    └─ 缓存到 /tmp/story-<book_id>-storyboard.json (失败可恢复)

[STEP 2] for each page:
    └─ generate-image (5 阶 fallback variants)
        ├─ original (用 LLM 写的 characters_in_scene + shot)
        ├─ drop-mama-keep-papa (仅当 ≥3 人时;cap=2 后基本 no-op)
        ├─ drop-papa-keep-mama (同上)
        ├─ medium-shot (wide → medium 缩窄)
        └─ shuishui-only (移除所有其他角色) ← 终极兜底,从未失败过
        
        每个 variant 内部:
          - moderation_blocked → 立即跳下一个 variant (确定性,重试无意义)
          - overload / network → 重试 3 次

[STEP 3] save-book → JSON 入库 → git push → GH Pages 部署
```

### 1.3 图像 prompt 编译 (src/lib/prompt-templates.ts → buildImagePrompt)

每页发给 gpt-image-2 的最终 prompt 结构:
```
<style.prompt_anchor>            ← 风格锚 (Zootopia 现代 3D)

SCENE:
- Location: <location, 中文>
- Weather: <weather>
- Time: <time_of_day>
- Props: <props 列表>
- Camera: <shot 英文化>
- Mood: <emotion 中文>

COMPOSITION: <composition_hint 经过 stripFamilyRoleWords 兜底>

CHARACTERS:
[shuishui]: <character.prompt_anchor>

[papa]: <character.prompt_anchor>

Portrait orientation, family-friendly storybook illustration, no text in image.
```

### 1.4 运行时安全兜底 (stripFamilyRoleWords)
LLM 偶尔会把"家庭称谓 / 年龄词 / 防御性免责语 / 俯身姿势"写进 composition_hint。运行时正则替换:
- `dad/mom/parent/family/child/kid/toddler/baby/girl/boy` → `fox/bunny/animal characters/small bunny/character`
- `爸爸/妈妈/孩子/小朋友/宝宝/一家三口` → `红狐狸/兔子/小动物/动物角色们`
- `fully clothed/fully covered/appropriate distance/safe distance` → 整段删除
- `crouching near/squatting near/leaning over/bending toward/paws on knees` → `standing near` / `standing`

---

## 2. 角色 prompt (4 个角色 + style + world)

### 2.1 shuishui (主角,3.5 岁女童拟人 → 小白兔)
```
拟人化白色小兔,卡通头身比 1:2,
纯白蓬松绒毛,长兔耳竖立向上,琥珀色眼睛,
身着粉色小裙子+粉色运动鞋,
头顶粉色碎花发带(发带前侧别粉色爱心发卡),
高级动画CGI风格,姿态自然.
```
关键暗示:
- `卡通头身比 1:2` 是非常明显的"幼儿/婴儿比例"信号
- `小裙子` `粉色` `碎花发带` `爱心发卡` 全是儿童女性符号

### 2.2 papa (爸爸,41 岁男性 → 红狐狸)
```
拟人化红狐狸,卡通比例,
红橙色蓬松毛发,腹部奶白,三角竖耳,蓬松大尾巴,
绿色眼睛,
休闲装扮(白色+深绿色+深蓝色配色),
高级动画CGI风格.
```
注:这版已经是简化版 — 之前带"细边玳瑁色眼镜+三宅一生外套"被反映"看起来像老头",已去掉。

### 2.3 mama (妈妈,34 岁女性 → 白兔子,与水水同物种)
```
拟人化兔子,匀称纤细身材,
灰白渐变兔毛点缀淡白色,大紫色眼睛,
长兔耳竖直,头上别小白花,
身着鲜亮柠檬黄底+白色大碎花连衣裙,米色小羊皮鞋,金色细项链,
高级动画CGI风格,姿态优雅.
```

### 2.4 laolao (姥姥,57 岁女性 → 绵羊) — 这次 3 本绘本未出现,但作为家庭成员一并提供
```
可爱的拟人化绵羊,采用高级动画电影级CGI风格,
微胖慈祥的体型,头顶卷毛打理整齐(纯白色卷毛),
柔软的绵羊耳朵软软地垂在脸两侧,笑起来眯眯眼,慈祥但精气神十足,
不戴任何眼镜,
身着白色亚麻衬衫+浅棕色棉麻宽松裤+暖灰色穆勒鞋,
时髦但不刻意的老太太气质,姿态自然放松慈祥.
```

### 2.5 临时角色 (claycat 故事里幼儿园 3 位老师,无固定 anchor,LLM 现编)
- 王老师 = 熊猫
- 张老师 = 长颈鹿
- 刘老师 = 小浣熊

### 2.6 style.prompt_anchor (画风锚)
```
modern 3D animated feature film aesthetic,
stylized anthropomorphic animal characters with expressive faces,
cinematic warm lighting with soft rim light,
painterly storybook background, soft brushwork environments,
clean clear silhouettes, vibrant but harmonious palette,
subject-centered framing, stylized cartoon proportions, slightly large heads,
high-quality storybook illustration in contemporary studio CG style
```

### 2.7 world.prompt_anchor (世界观)
```
modern anthropomorphic animal world,
bipedal cartoon animal characters wearing modern clothing,
warm domestic and urban settings,
storybook illustration tone, no real humans
```
配套规则(写进故事 system prompt):
- 所有角色双足直立,类人比例(头大身小一点,更适合儿童绘本)
- 保留显著的动物特征:耳朵、尾巴、毛色、口鼻轮廓
- 穿全套人类风格衣服(不是动物原始毛皮)
- 家庭混合物种是常态(兔妈+狐爸+兔宝)— **注意:不要带任何 Zootopia 原作里的物种张力情节**
- 现代都市/家庭背景,不出现奇幻元素

---

## 3. 实验数据 — 三本书的 Moderation 结果

> 关键观察:**同样的 shuishui,搭配不同角色,通过率截然不同。**

### 3.1 通过率汇总 (一次过 = original variant 第一次就成功)

| 角色组合 | 一次过 | 失败后兜底成功 | 一次过率 |
|---|---|---|---|
| shuishui + mama (白兔子) | 4/4 | 0 | **100%** |
| shuishui + 老师(熊猫/长颈鹿/小浣熊) | 3/3 | 0 | **100%** |
| shuishui + papa (红狐狸) | 5/19 | 14 | **26%** |

### 3.2 详细页码对照表

#### Book 1 — playground (公园游乐场,12 页)
| 页 | 组合 | 镜头 | 场景 | 一次过? |
|---|---|---|---|---|
| 1 | shuishui+papa | wide | 公园游乐场入口 | (跳过 — 之前已渲染) |
| 2 | shuishui+papa | medium | 七彩迷宫球 | (跳过) |
| 3 | shuishui+papa | close-up | 钻迷宫球 | ✅ |
| 4 | shuishui+papa | wide | 大轮胎滑梯 | ✅ |
| 5 | shuishui+mama | close-up | 妈妈陪滑 | ✅ |
| 6 | shuishui+mama | medium | 短滑梯前 | ✅ |
| 7 | shuishui+mama | close-up | 独立尝试中 | ✅ |
| 8 | shuishui+mama | close-up | 成功后自豪 | ✅ |
| 9 | shuishui+papa | wide | 浅水池+防水服 | ✅ (第 2 次,先 overload) |
| 10 | shuishui+papa | medium | 水池捞鱼 | ❌ moderation → shuishui-only ✅ |
| 11 | shuishui+papa | extreme-close-up | 数 8 条鱼 | ❌ moderation → shuishui-only ✅ |
| 12 | shuishui+papa | medium | 把鱼放回 | ❌ moderation → shuishui-only ✅ |

**playground 一次过率:5/9 (跳过 1-2 不计) = 56%。失败集中在水池场景。**

#### Book 2 — ants (公园看蚂蚁,10 页)
| 页 | 组合 | 镜头 | 场景 | 一次过? |
|---|---|---|---|---|
| 1 | shuishui+papa | wide | 公园游乐场 | ❌ moderation → medium-shot ✅ |
| 2 | shuishui+papa | medium | 长椅休息 | ❌ moderation → shuishui-only ✅ |
| 3 | shuishui+papa | close-up | 看蚂蚁 | ❌ moderation → shuishui-only ✅ |
| 4 | shuishui+papa | medium | 看蚂蚁搬面包渣 | ❌ moderation → shuishui-only ✅ |
| 5 | shuishui+papa | close-up | 听爸爸讲蚂蚁 | ❌ moderation → shuishui-only ✅ |
| 6 | shuishui+papa | extreme-close-up | 蚂蚁队伍特写 | ❌ moderation → shuishui-only ✅ |
| 7 | shuishui+papa | medium | 安静看 | ❌ moderation → shuishui-only ✅ |
| 8 | shuishui+papa | wide | 草地+长椅 | ❌ moderation × 2 → shuishui-only ✅ |
| 9 | shuishui+papa | close-up | 心里热乎乎 | ❌ moderation → shuishui-only ✅ |
| 10 | shuishui+papa | medium | 离开 | ❌ moderation → shuishui-only ✅ |

**ants 一次过率:0/10 = 0%。每一页 shuishui+papa 组合都被拒。**

#### Book 3 — claycat (幼儿园陶泥,12 页) — **关键对照组**
| 页 | 组合 | 镜头 | 场景 | 一次过? |
|---|---|---|---|---|
| 1 | shuishui+papa | wide | 幼儿园教室 | ❌ moderation × 2 → shuishui-only ✅ |
| 2 | shuishui+papa | medium | 选橘色陶泥 | ❌ moderation → shuishui-only ✅ |
| 3 | shuishui+papa | close-up | 看玩具橘猫 | ❌ moderation → shuishui-only ✅ |
| 4 | shuishui+papa | medium | 搓陶泥身子 | ✅ |
| 5 | shuishui+papa | close-up | 捏猫耳朵 | ✅ |
| 6 | shuishui+papa | extreme-close-up | 贴猫眼睛 | ✅ |
| 7 | shuishui+papa | close-up | 完成小吊牌 | ✅ |
| **8** | **shuishui+王老师(熊猫)** | medium | 给老师看 | **✅ 一次过** |
| **9** | **shuishui+张老师(长颈鹿)** | wide | 给老师看 | **✅ 一次过** |
| **10** | **shuishui+刘老师(小浣熊)** | close-up | 给老师看 | **✅ 一次过** |
| 11 | shuishui+papa | medium | 活动结束 | ❌ moderation → shuishui-only ✅ |
| 12 | shuishui+papa | close-up | 牵手回家 | ❌ moderation → shuishui-only ✅ |

**claycat 一次过率:7/12 = 58%。pages 8-10 用了非家庭物种(熊猫/长颈鹿/小浣熊)做配角,3 页全部一次过;前后 5 页 shuishui+papa 全部触发 moderation。**

### 3.3 决定性对照
跨 3 本书,把数据按"配角动物种类"重新切片:

- **配角是兔子 (mama)**: 4 页全部一次过 (100%)
- **配角是熊猫 / 长颈鹿 / 小浣熊 (老师)**: 3 页全部一次过 (100%)
- **配角是红狐狸 (papa)**: 19 页中只有 5 页一次过 (26%)
- **场景 = 水池(防水服)+ 红狐狸**: 3/3 全部触发 moderation

---

## 4. 实际发给 gpt-image-2 的 prompt 样例 (ants 第 3 页,确定性触发 moderation)

> 这是 stripFamilyRoleWords 兜底之后、最终送达 Azure 路由的完整 prompt。

```
modern 3D animated feature film aesthetic,
stylized anthropomorphic animal characters with expressive faces,
cinematic warm lighting with soft rim light,
painterly storybook background, soft brushwork environments,
clean clear silhouettes, vibrant but harmonious palette,
subject-centered framing, stylized cartoon proportions, slightly large heads,
high-quality storybook illustration in contemporary studio CG style

SCENE:
- Location: 公园长椅旁
- Weather: 晴天
- Time: 早
- Props: 长椅, 蚂蚁队伍, 小石子
- Camera: close-up
- Mood: 好奇

COMPOSITION: shuishui watching a line of ants beside a wooden bench, papa standing nearby

CHARACTERS:
[shuishui]: 拟人化白色小兔,卡通头身比 1:2,
纯白蓬松绒毛,长兔耳竖立向上,琥珀色眼睛,
身着粉色小裙子+粉色运动鞋,
头顶粉色碎花发带(发带前侧别粉色爱心发卡),
高级动画CGI风格,姿态自然.

[papa]: 拟人化红狐狸,卡通比例,
红橙色蓬松毛发,腹部奶白,三角竖耳,蓬松大尾巴,
绿色眼睛,
休闲装扮(白色+深绿色+深蓝色配色),
高级动画CGI风格.

Portrait orientation, family-friendly storybook illustration, no text in image.
```

实际 Azure 回复:`moderation_blocked` (HTTP 502 from gateway)。

---

## 5. 一个 100% 通过的对照组 prompt (claycat 第 9 页,wide 镜头都过了)

```
<style.prompt_anchor 同上>

SCENE:
- Location: 幼儿园活动室
- Weather: 室内
- Time: 傍晚
- Props: 长颈鹿老师, 小橘猫陶泥, 桌椅
- Camera: wide establishing shot
- Mood: 开心

COMPOSITION: shuishui showing a small orange clay cat to a tall giraffe teacher in a busy classroom

CHARACTERS:
[shuishui]: <同上>

[zhang_teacher]: <LLM 现编 — 拟人化长颈鹿老师,温柔的笑容,围着长围巾...>

Portrait orientation, family-friendly storybook illustration, no text in image.
```

一次过。

---

## 6. 我们已经做过的兜底 (但没有根除问题)

1. **JSON Schema 强 cap `characters_in_scene` ≤ 2**(避免 3 人同框 100% 拒)
2. **System prompt 显式禁止家庭称谓 / 防御性免责语 / 俯身姿势**
3. **运行时 stripFamilyRoleWords 正则兜底**(LLM 仍偶尔写出 dad/mom/fully clothed/crouching)
4. **5 阶 fallback variants**(终极兜底:`shuishui-only` 把 papa 完全移出画面 — 从未失败)
5. **简化角色 anchor**(去眼镜、去多件正装,降低"成人化"信号)

---

## 7. 想请 GPT 分析的问题

1. **为什么 "shuishui (白兔) + papa (红狐狸)" 的组合会被 Azure 安全分类器持续触发,而 "shuishui + mama (白兔)" / "shuishui + 熊猫/长颈鹿/小浣熊" 反而稳定通过?**

   候选假设(请评估并补充):
   - **a. ⭐ Zootopia IP / Disney 版权触发器**(用户重点怀疑) — Zootopia 原作的核心 CP 就是"狐狸 Nick + 兔子 Judy",且画风明确写了 "Disney Zootopia (2016)"。Azure 对受版权保护的视觉风格 + 标志性 IP 角色组合有专门分类器。组合证据:画风 prompt 里直接出现 `Disney Zootopia (2016)`、`Zootopia Nick 同款气质`,角色配对刚好是 Nick(红狐)+ Judy(兔)的同形态,Azure 极可能识别为"复刻 Disney IP 角色"。这跟"成人+幼儿"是完全不同的分类信号 — 也能解释为什么把 papa 换成熊猫/长颈鹿/小浣熊就立刻通过(不是 Zootopia 主角配对)。
   - **b. 物种 visual pairing 触发 predator-prey 视觉模板** — 狐狸 + 兔子是经典捕食/猎物对,Azure 视觉分类器可能识别为"威胁/紧张"场景
   - **c. 体型差异触发 "成人 + 幼儿" 模板** — 红狐狸"蓬松大尾巴 + 三角竖耳" vs 白兔子"卡通头身比 1:2",视觉对比是大型动物 + 类幼儿比例
   - **d. 颜色对比触发** — 红橙色 + 纯白色在儿童内容上有特定敏感模式
   - **e. shuishui 的 "卡通头身比 1:2" + "粉色裙子/发带/爱心发卡" 是过强的 "幼儿女童" 信号** — 与任何成年角色配对都偏高风险,只是兔妈/老师场景下**视觉差距更小**所以飘过阈值
   - **f. 水池/亲密接触/wooden bench 场景元素** 在叠加 "成年红色动物 + 幼儿白色动物" 时把 prompt 推过阈值
   - **g. 中英混合 prompt** 让 Azure 难以做语义脱敏(Azure 主要英文训练)
   
   **请按概率从高到低排序这些假设,并指出哪些可以通过修改 prompt 验证、哪些只能通过修改设定验证。**
   
2. **如果假设 d 成立,如何在不损失"水水的可爱辨识度"前提下减弱"幼儿女童"信号?**
   - 改 `卡通头身比 1:2` → ?
   - 去掉 `小裙子` `碎花发带` `爱心发卡` 中的某些?
   - 但又要保留 — 用户希望水水"看起来还是水水",不能改成中性人形
   
3. **是否应该在 prompt 中显式描述"两个角色独立站立,各自做各自的事,无身体接触"?** 还是这本身就是 stripFamilyRoleWords 已经在做的,且已知防御性表述会反作用?

4. **有没有可能 — papa 的红橙色 + shuishui 的纯白色 + 粉色 — 这个三色组合本身在某些 Azure 训练数据里映射到了成人类内容?** 如果是,改 papa 的主色(比如改成棕色狐狸或灰色狼/熊)是否能彻底解决?

5. **是否应该完全去掉 composition_hint 这一字段?** 这个由 LLM 自由生成的英文一句话是 80% 安全事故的来源 — 是否可以让 LLM 只输出 characters_in_scene + scene_state, 由后端模板硬编码 composition?

6. **针对水池/防水服场景**:这种场景是否就应该一刀切只用 `shuishui-only`? 还是有办法在保留 papa 出场的同时让 Azure 通过?

7. **建议 papa 的 prompt_anchor 怎么重写?** 既保留"红狐狸 + 设计师爸爸"的辨识度,又降低与白兔子配对时的触发率。

8. **如果假设 a (Zootopia IP 触发) 是主因,我应该怎么改?** 给我两个梯度的方案,我可以分别实验:
   - **保守改动**:保留"红狐狸爸爸 + 白兔水水"的物种设定,只把画风 prompt 里所有 Zootopia/Nick/Judy 等字眼彻底去掉,改成中性的 "modern 3D animated feature film" 描述。这够吗?
   - **激进改动**:连物种本身一起换 — 比如爸爸改成棕熊/灰狼/其他不与 Zootopia 主角对应的动物,妈妈和水水继续保留兔子设定(因为兔子家族单独存在不触发 IP)。这个方案会损失"狐狸+兔子混合家庭"的趣味性,但如果能彻底解决问题,我可以接受。
   
   **请明确告诉我:从你的判断,(a) 改画风文字 / (b) 改物种 / (c) 两者都要,哪个是真正的解药?**

---

## 附录:依赖文件位置(如需进一步查看)

- 工作流主程序:`scripts/book-runner.mjs`
- Prompt 编译:`src/lib/prompt-templates.ts` (含 `buildStorySystemPrompt` / `buildImagePrompt` / `stripFamilyRoleWords`)
- JSON Schema:`src/lib/story-schema.ts`
- 角色 yaml:`assets/bible/characters/{shuishui,papa,mama,laolao}.yaml`
- 风格 yaml:`assets/bible/{style,world}.yaml`
- 角色参考图:`assets/bible/character_refs/{shuishui,papa,mama,laolao}.png`
- 三本书 storyboard 缓存:`/tmp/story-{playground,ants,claycat}-2026-05-28-storyboard.json`
- 三本书运行日志:`/tmp/story-{playground,ants,claycat}-2026-05-28.log`
- 已生成图像:`public/generated/{playground,ants,claycat}-2026-05-28/page-NN.png`
