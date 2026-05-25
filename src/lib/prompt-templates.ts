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
8 页绘本，每页：
- narration：1-2 句旁白文字（简单中文，3-4 岁能懂）
- dialogue：0-2 句角色对话（speaker 用角色 id，例如 "shuishui"、"mama"）
- shot：镜头景别（wide / medium / close-up / extreme-close-up）
- emotion：当前页主角的情绪（如"好奇"、"害怕"、"开心"）
- characters_in_scene：这页出现的角色 id 列表
- scene_state：location（地点中文）、weather（天气）、time_of_day（早/中/晚）、props（道具数组）
- composition_hint：英文一句构图提示（给图像模型用，例如 "shuishui crouching by the front door, looking up at the rain"）

# 8 页节奏（绘本三幕结构）
- 页 1：背景建立 + 触发事件（wide shot 建场）
- 页 2-3：水水的反应、矛盾出现
- 页 4-5：转折——尝试 / 失败 / 帮助
- 页 6-7：成功 / 学到什么（情绪高点用 close-up）
- 页 8：温暖结尾（暗示成长）

# 镜头节奏要求
8 页里 shot 不能超过 3 页相同。情绪高点用 close-up；建立环境用 wide。

# 写作风格
- 语言节奏短，朗朗上口
- 情感要饱满但不煽情
- 体现角色性格细节
- 不要说教，故事自己说话`;
}

export function buildStoryUserPrompt(req: StoryRequest): string {
  return `生活素材：${req.trigger}

教育目标：${req.education_goal}

请生成 8 页绘本。`;
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

  return `${style.prompt_anchor.trim()}

CHARACTERS IN THIS SCENE (lock identity strictly):
${charBlock}

SCENE:
- Location: ${sceneState.location}
- Weather: ${sceneState.weather ?? 'n/a'}
- Time: ${sceneState.time_of_day ?? 'n/a'}
- Props: ${(sceneState.props ?? []).join(', ') || 'none'}
- Camera: ${shotEn}
- Mood / emotion: ${page.emotion}

COMPOSITION: ${page.composition_hint ?? ''}

CRITICAL CONSTRAINTS:
- Portrait orientation, designed for full-screen phone viewing
- Main subject vertically centered with breathing room top and bottom (image will be cropped to ~9:19.5 phone aspect via cover-fit)
- Keep character outfits and accessories EXACTLY as described — do not invent new clothing, do not change colors
- All characters are anthropomorphic animals (walking on two legs, wearing clothes), never realistic photo-style animals
- No text, no captions, no speech bubbles in the image
- Single coherent illustration, picture-book quality`;
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
