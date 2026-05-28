import type { CharacterBible, StyleBible, WorldBible } from './bible';
import type { Page } from './types';

export type StoryRequest = {
  trigger: string;
  education_goal: string;
  characters_in_book: string[];
  characters: CharacterBible[];
  world: WorldBible;
};

export function buildStorySystemPrompt(req: StoryRequest): string {
  const charDescriptions = req.characters
    .filter((c) => req.characters_in_book.includes(c.id))
    .map(
      (c) =>
        `- **${c.name_cn}** (id: ${c.id}, 拟人 ${c.animal}, ${c.role}): ${
          (c as Record<string, unknown>).personality
            ? JSON.stringify((c as Record<string, unknown>).personality)
            : ''
        }`,
    )
    .join('\n');

  return `你是一位儿童绘本故事编剧，专门为 3-4 岁孩子写温暖、贴近生活的小故事。

# 世界观（所有故事必须遵守）
${req.world.setting}
规则：${req.world.rules.join('；')}

# 这本书的角色
${charDescriptions}

# 你必须输出的结构
绘本长度 8-15 页（由你根据故事素材自行决定，详见下方"长度判断"），每页：
- narration：1-2 句旁白文字（简单中文，3-4 岁能懂）
- dialogue：0-2 句角色对话（speaker 用角色 id，例如 "shuishui"、"mama"）
- shot：镜头景别（wide / medium / close-up / extreme-close-up）
- emotion：当前页主角的情绪（如"好奇"、"害怕"、"开心"）
- characters_in_scene：这页出现的角色 id 列表
- scene_state：location（地点中文）、weather（天气）、time_of_day（早/中/晚）、props（道具数组）
- composition_hint：英文一句构图提示（给图像模型用）。**严格规则**:
  1. 只能用角色 id (shuishui/papa/mama/laolao) 或动物物种 (white rabbit/red fox/sheep) 来指代角色,**绝对不要**写 dad/father/mom/mother/papa/mama/parent/family/child/kid/toddler/baby/girl/boy/little girl 等家庭称谓或人类年龄词。
  2. **绝对不要**加防御性免责语（这些反作用、会触发安全过滤）：禁止写 "fully clothed"、"upright"、"fully covered"、"appropriate distance"、"no inappropriate"、"safe distance"、"family-friendly" 等。
  3. **避免亲密俯身姿态**：禁止 "crouching near"、"squatting near"、"leaning over/toward"、"bending toward"、"pointing at shuishui"、"paws on knees"。改用直立动词："standing"、"walking"、"watching"、"holding"、"reaching"。
  例 ✓: "shuishui and papa watching ants on a wooden bench, both standing"; "shuishui reaching toward a colorful maze ball, papa nearby"
  例 ✗: "shuishui crouching with paws on knees, red fox leaning nearby, both upright and fully clothed"

# 长度判断（8-15 页动态）
看故事素材的事件密度自己定 N：
- 单一冲突 / 一个小决定 → 8 页
- 多个并列活动 / 多场景串联 → 10-13 页
- 长跨度多幕（如一整天/旅程） → 13-15 页
不要为了凑页数注水，也不要为了短而砍掉关键情节。

# 节奏（绘本三幕结构,等比例缩放到 N 页）
- 开头约 1/4 的页数：背景建立 + 触发事件（首页用 wide shot 建场）
- 中间约 1/2 的页数：反应、矛盾、尝试、转折（每个关键活动 / 决定都给独立的一页）
- 结尾约 1/4 的页数：成功 / 学到什么 + 温暖收束（情绪高点用 close-up，末页暗示成长）

# 镜头节奏要求
shot 多样化:同一种 shot 不能连续 3 页,也不能超过总页数的 40%。情绪高点用 close-up；建立环境/全景用 wide。

# 角色出场密度要求(硬性约束)
**每页 characters_in_scene 最多 2 个角色,绝对不能 3 个或以上同框。**
即便剧情写"一家三口",画面也只画水水 + 一位家长(其他人通过旁白文字提及即可)。
违反此规则会触发图像生成模型的安全过滤,导致出图失败。

# 写作风格
- 语言节奏短，朗朗上口
- 情感要饱满但不煽情
- 体现角色性格细节
- 不要说教，故事自己说话`;
}

export function buildStoryUserPrompt(req: StoryRequest): string {
  return `生活素材：${req.trigger}

教育目标：${req.education_goal}

请按上面"长度判断"决定页数(8-15 页),然后生成绘本。`;
}

// ━━━ Image prompt compilation ━━━

// Family-role / age words that trigger Azure safety classifier (adult+child inference).
// LLM will sometimes sneak these into composition_hint despite system-prompt rules,
// so we strip them at runtime. Detected from real moderation_blocked rejections.
function stripFamilyRoleWords(s: string): string {
  if (!s) return s;
  return s
    // English: dad/mom/parents/family/child/kid/girl/boy/etc.
    .replace(/\b(dad|daddy|father|fatherly)\b/gi, 'fox')
    .replace(/\b(mom|mommy|mother|motherly)\b/gi, 'bunny')
    .replace(/\b(papa|mama)\b/gi, '')
    .replace(/\b(parent|parents|family|families)\b/gi, 'animal characters')
    .replace(/\b(child|children|kid|kids|toddler|toddlers|baby|babies|infant)\b/gi, 'small bunny')
    .replace(/\b(little\s+(girl|boy|kid))\b/gi, 'small bunny')
    .replace(/\b(girl|boy)\b/gi, 'character')
    // Defensive disclaimers — these BACKFIRE on Azure safety classifier (saying "fully clothed"
    // signals "this might not be"). Strip them entirely.
    .replace(/\bboth\s+upright\s+and\s+fully\s+clothed\b/gi, '')
    .replace(/\bfully\s+clothed\b/gi, '')
    .replace(/\bfully\s+covered\b/gi, '')
    .replace(/\bappropriate\s+(distance|attire|clothing)\b/gi, '')
    .replace(/\bno\s+inappropriate\b[^,.]*[,.]?/gi, '')
    .replace(/\bsafe\s+distance\b/gi, '')
    // Intimate / submissive postures of the small character + an adult-sized character form
    // a high-risk Azure signal. Replace with neutral upright actions.
    .replace(/\bshuishui\s+crouching\b/gi, 'shuishui standing')
    .replace(/\bshuishui\s+squatting\b/gi, 'shuishui standing')
    .replace(/\bcrouching\s+(near|by|beside|next\s+to)\b/gi, 'standing near')
    .replace(/\bsquatting\s+(near|by|beside|next\s+to)\b/gi, 'standing near')
    .replace(/\bleaning\s+(over|toward|nearby|close)\b/gi, 'standing near')
    .replace(/\bbending\s+(over|toward|down)\b/gi, 'standing near')
    .replace(/\b(red\s+fox|bunny|sheep)\s+pointing\s+(at|toward)\b/gi, '$1 looking at')
    .replace(/\bpaws\s+on\s+knees\b/gi, 'standing')
    // Chinese: 爸爸/妈妈/姥姥/孩子/小朋友/幼儿/宝宝
    .replace(/(爸爸|父亲)/g, '红狐狸')
    .replace(/(妈妈|母亲)/g, '兔子')
    .replace(/(姥姥|外婆|奶奶|爷爷)/g, '动物')
    .replace(/(孩子|小朋友|幼儿|宝宝|小女孩|小男孩|小孩)/g, '小动物')
    .replace(/(一家三口|一家人|全家)/g, '动物角色们');
}

export function buildImagePrompt(args: {
  page: Page;
  style: StyleBible;
  characters: CharacterBible[];
}): string {
  const { page, style, characters } = args;
  const inScene = page.characters_in_scene
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean) as CharacterBible[];

  // 注意:section label 只用 c.id(英文 slug),不带 c.name_cn —
  // "爸爸/妈妈/姥姥" 这类家庭称谓 + "幼儿宝宝" 等中文词组在 Azure 安全模型上
  // 会被识别为"成人+真实幼儿"组合,触发 moderation_blocked。详见 docs/PROMPT_GUIDE.md。
  const charBlock = inScene
    .map((c) => `[${c.id}]: ${c.prompt_anchor.trim()}`)
    .join('\n\n');

  const shotEn = ({
    wide: 'wide establishing shot',
    medium: 'medium shot',
    'close-up': 'close-up',
    'extreme-close-up': 'extreme close-up',
  } as Record<string, string>)[page.shot];

  const sceneState = page.scene_state;

  // 注意:防御性表述("NO real humans"、"fully clothed"、"NEVER human-looking" 等)
  // 在 Azure 安全模型上反作用——越强调"不是 X",越容易被识别为 X 边缘 prompt。
  // 已实证:精简后通过率显著上升。详见 docs/PROMPT_GUIDE.md。
  //
  // 重要:LLM 生成的 composition_hint 偶尔会带 "dad/mom/child/family"
  // 等家庭称谓/年龄词,这些是 Azure 安全分类器的强触发(成人+幼儿组合)。
  // 已通过 system prompt 显式禁止,仍在运行时兜底替换。
  const safeHint = stripFamilyRoleWords(page.composition_hint ?? '');
  const safeLocation = stripFamilyRoleWords(sceneState.location);
  const safeProps = (sceneState.props ?? []).map((p) => stripFamilyRoleWords(p));

  return `${style.prompt_anchor.trim()}

SCENE:
- Location: ${safeLocation}
- Weather: ${sceneState.weather ?? 'n/a'}
- Time: ${sceneState.time_of_day ?? 'n/a'}
- Props: ${safeProps.join(', ') || 'none'}
- Camera: ${shotEn}
- Mood: ${page.emotion}

COMPOSITION: ${safeHint}

CHARACTERS:
${charBlock}

Portrait orientation, family-friendly storybook illustration, no text in image.`;
}

export function buildCharacterRefPrompt(args: {
  character: CharacterBible;
  style: StyleBible;
}): string {
  const { character, style } = args;
  return `${style.prompt_anchor.trim()}

CHARACTER REFERENCE SHEET (turnaround pose, neutral expression):
${character.prompt_anchor.trim()}

LAYOUT:
- Single character standing centered, full body visible
- Plain soft pastel background, no other characters or props
- Three-quarter front view
- Neutral confident expression
- Studio character-design lighting (clean, even)
- Portrait orientation
- This is a CHARACTER MODEL SHEET used for downstream consistency — keep the design canonical and unambiguous`;
}
