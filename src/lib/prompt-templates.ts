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
- composition_hint：英文一句构图提示（给图像模型用，例如 "shuishui crouching by the front door, looking up at the rain"）

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

export function buildImagePrompt(args: {
  page: Page;
  style: StyleBible;
  characters: CharacterBible[];
}): string {
  const { page, style, characters } = args;
  const inScene = page.characters_in_scene
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean) as CharacterBible[];

  const charBlock = inScene
    .map((c) => `[${c.name_cn} - ${c.id}]: ${c.prompt_anchor.trim()}`)
    .join('\n\n');

  const shotEn = ({
    wide: 'wide establishing shot',
    medium: 'medium shot',
    'close-up': 'close-up',
    'extreme-close-up': 'extreme close-up',
  } as Record<string, string>)[page.shot];

  const sceneState = page.scene_state;

  return `IMPORTANT FRAMING: This is a fictional anthropomorphic animal cartoon illustration. ALL characters are talking animal characters with animal heads, animal ears, animal tails, walking on two legs, fully clothed. NO real humans, NO photorealism. This is a stylized 3D animation artwork.

${style.prompt_anchor.trim()}

CHARACTERS IN THIS SCENE (lock identity strictly):
${charBlock}

SCENE:
- Location: ${sceneState.location}
- Weather: ${sceneState.weather ?? 'n/a'}
- Time: ${sceneState.time_of_day ?? 'n/a'}
- Props: ${(sceneState.props ?? []).join(', ') || 'none'}
- Camera: ${shotEn}
- Mood: ${page.emotion}

COMPOSITION: ${page.composition_hint ?? ''}

CRITICAL CONSTRAINTS:
- Portrait orientation, designed for full-screen phone viewing
- Main subject vertically centered with breathing room top and bottom (image will be cropped to ~9:19.5 phone aspect via cover-fit)
- Keep character outfits and accessories EXACTLY as described — do not invent new clothing, do not change colors
- ALL characters are anthropomorphic animals (animal heads, animal ears, animal tails) — NEVER human-looking, NEVER realistic
- No text, no captions, no speech bubbles in the image
- Single coherent illustration, family-friendly picture-book quality`;
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
