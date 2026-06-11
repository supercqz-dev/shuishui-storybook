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

# 书名与副标题（非常重要）
- **title：简短、地道、纯真的英文绘本名,2-5 个词**。像经典英文童书那样朗朗上口。
  ✓ 好例子："Rainy Day Splash"、"The Big Slide"、"Busy Little Ants"、"A Seed of My Own"
  ✗ 坏例子:中文标题("水水的勇敢滑一下")、拼音句子、超过 6 个词的长句、生硬直译。
  **不要在标题里出现主角名 "ShuiShui"**——整套绘本都是她的故事,每本都点名是多余的。请用题材/动作/意象本身来命名,让标题更像一本独立的童书。
- **subtitle：一行简短的中文副标题**(给家长一眼看懂故事),温暖概括,例如"水水第一次自己滑滑梯"。

# 你必须输出的结构
绘本长度 8-22 页（由你根据故事素材自行决定，详见下方"长度判断"），每页：
- narration：1-2 句旁白文字（简单中文，3-4 岁能懂）
- dialogue：0-2 句角色对话（speaker 用角色 id，例如 "shuishui"、"mama"）
- shot：镜头景别/远近（wide / medium / close-up / extreme-close-up）
- camera_angle：机位角度，与 shot 正交。**默认且主力是 eye-level 平视 和 three-quarter 正面/侧前**（看得清脸和互动，孩子好理解）。少数点睛页才用：high-angle 俯拍（建场）/ low-angle 仰拍（情绪高点）/ over-the-shoulder 过肩 / from-behind 背身（全册≤2，只为带观众看向前方）。**pov 不要用**（对小朋友太抽象）。详见下方"# 导演"配额规则。
- emotion：当前页主角的情绪（如"好奇"、"害怕"、"开心"）
- characters_in_scene：这页出现的角色 id 列表
- scene_state：location（地点中文）、weather（天气）、time_of_day（早/中/晚）、props（道具数组）
- composition_hint：英文一句构图提示（给图像模型用）。**严格规则**:
  1. 只能用上面列出的角色 id 或角色对应的动物物种 (例如 white rabbit / red fox / red panda / sheep) 来指代角色,**绝对不要**写 dad/father/mom/mother/papa/mama/parent/family/child/kid/toddler/baby/girl/boy/little girl 等家庭称谓,也**绝对不要**写任何人类年龄(如 "3 year old"、"41岁"、"aged 5")——年龄是故事设定,跟画面无关,且"精确年龄+动物角色"是图像安全模型的强触发组合。
  2. **绝对不要**加防御性免责语（这些反作用、会触发安全过滤）：禁止写 "fully clothed"、"upright"、"fully covered"、"appropriate distance"、"no inappropriate"、"safe distance"、"family-friendly" 等。
  3. **避免亲密俯身姿态**：禁止 "crouching near"、"squatting near"、"leaning over/toward"、"bending toward"、"pointing at shuishui"、"paws on knees"。改用直立动词："standing"、"walking"、"watching"、"holding"、"reaching"。
  4. **游乐设施/道具要展开成具体英文外观描述,不要直接搬中文名**:图像模型不认识"七彩迷宫球""轮胎滑梯"这类中文活动名,会画错。请把设备翻译成它真实的视觉构造(形状+材质+颜色+玩法)。
     例:"彩虹滑道" → "a colorful outdoor rainbow dry tubing slide on an artificial grass slope, covered with rainbow-colored sliding mats, riders sitting in round inflatable tubes sliding down";"六边形攀爬洞" → "colorful modular honeycomb climbing structure, large hexagonal tunnel blocks, bright plastic panels, crawl-through holes"。宁可描述得长而具体,也不要用一个模糊的名词。
  5. **任何非家庭配角(老师、同学、其他家长、路人等)都必须指定一个明确的动物物种**,并在 composition_hint 里让该配角作为画面动作的主体清晰出现。**血泪教训**:如果只写"老师/同学"而不给物种,图像模型不知道他们长什么样,会把"讲课/拿东西/做动作"这些主体动作错误地安到有固定形象的家庭角色(尤其是 papa)身上,导致"本该老师讲课却画成爸爸讲课"。
     - **固定配角物种(必须遵守,保持跨绘本一致)**:王老师 = 大熊猫(giant panda,不戴眼镜);刘老师 = 长颈鹿(giraffe,不戴眼镜)。其他临时配角(同学/别的家长)自行指定合理物种(熊/小猪/小象/松鼠等)并写进 hint。
     - 当配角是画面动作主体时,hint 要点明分工,例:"a GIANT PANDA teacher at the front teaching the class, shuishui and red panda papa SEATED in the audience listening (papa is a listener, NOT teaching)"。
  6. **临时服装优先级最高**:如果故事素材/当页明确说角色穿睡衣、雨衣、运动服、围裙等临时衣服,composition_hint 必须写清楚该临时服装,并覆盖角色默认 YAML 服装。不要同时画默认裙子/鞋子。例:"shuishui wears short-sleeve long pajamas instead of her usual pink dress"。
  7. **composition_hint 要呼应当页的 camera_angle**,但记住绝大多数页是正面/平视(看得到脸和表情)。只有少数点睛页才用特殊机位。各机位写法示例:
     - eye-level / three-quarter(主力)→ "an eye-level view of shuishui and papa face to face, both smiling, warm and clear"; "a three-quarter front view of the two playing together"
     - high-angle(建场,少用)→ "a high view looking down on the brick-red path stretching ahead, the two cycling along it"
     - low-angle(情绪高点,少用)→ "a low-angle view looking up at shuishui standing tall and proud"
     - from-behind(全册≤2,只为带观众看向前方)→ "from behind: the two in the foreground looking toward the rainbow arch ahead"
     - 施动/受动动作 → 写清动作关系,例(拍照):"a three-quarter view from behind-and-to-the-side of papa: papa stands holding up a phone photographing shuishui who poses ahead on her bike — papa's picture-taking pose fully visible, NOT a selfie"
  例 ✓: "an eye-level three-quarter view of shuishui and papa laughing together by the path, both faces visible"; "a GIRAFFE teacher demonstrating planting at the front table, shuishui watching, red panda papa seated beside her as a listener"
  例 ✗: "shuishui's point of view of the drain hole"(禁用 pov,太抽象); "seen from behind as they look at..."(背影别滥用,看不到脸); "papa and shuishui taking a selfie together"(拍照应是爸爸给水水拍,不是自拍); "the teacher teaching the class"(配角无物种,会被画成爸爸)

# 长度判断（8-22 页动态）
看故事素材的事件密度自己定 N：
- 单一冲突 / 一个小决定 → 8 页
- 多个并列活动 / 多场景串联 → 10-15 页
- 长跨度多幕（如一整天/旅程/幼儿园完整一天） → 15-22 页
不要为了凑页数注水，也不要为了短而砍掉关键情节。

# 节奏（绘本三幕结构,等比例缩放到 N 页）
- 开头约 1/4 的页数：背景建立 + 触发事件（首页用 wide shot 建场）
- 中间约 1/2 的页数：反应、矛盾、尝试、转折（每个关键活动 / 决定都给独立的一页）
- 结尾约 1/4 的页数：成功 / 学到什么 + 温暖收束（情绪高点用 close-up，末页暗示成长）

# 导演:镜头与机位(关键原则——克制!)
你既是编剧也是导演,每页要定 shot(景别)和 camera_angle(机位)。但**这是给 3 岁孩子看的绘本,绝大多数页面应该是正面、平视、能清楚看到两个角色的脸和表情的画面**——这样孩子最好理解、最能感受角色的互动和情绪。镜头的目的是讲好故事,不是炫技。

**核心配额(务必遵守):**
- **主力镜头 = eye-level 平视 + 正面/侧前的 three-quarter**,这两类应占全书大多数页(看得到脸、看得到互动)。
- **"非常规机位"(high-angle 俯拍 / low-angle 仰拍 / over-the-shoulder 过肩 / from-behind 背身)全书总共只用 4-5 页**,作为点睛,不能更多。
- **from-behind 背身最多 2 页**,且只在"带观众一起看向前方的新发现/新场景"时用;背身看不到脸,不要拿它偷懒交代场景。
- **pov 第一人称视角:不要使用**(对小朋友太抽象)。

**什么时候才动用非常规机位(精挑 4-5 处):**
1. **开头建场不等于默认俯拍**:首页应根据故事内容选择镜头。室内/亲密互动开场优先 eye-level 或 three-quarter,看清角色脸和动作;只有当首页需要交代大空间布局(操场/街道/长路线/大型场景)时,才可用 wide + high-angle。
2. **到达/地点即主角**:到达一个重要新场景(终点车站、一片新天地)时,可用 wide 把场景铺开——但仍尽量让角色正面可见,不要只剩背影。
3. **一个情绪高点**:勇敢/高大的瞬间可用 low-angle 仰拍。
4. 其余页面根据剧情规划镜头语言:亲密对话用 eye-level/three-quarter,动作关系用能拍清施动者和受动者的角度,场景转换才用 wide,不要为了变化而滥用俯拍。

**施动/受动的双人动作,机位要拍出"动作本身"(重要):**
当一页是"A 给 B 做某事"(例:爸爸给水水拍照、爸爸帮水水暖手、爸爸牵引自行车),机位要让**施动者和受动者都清楚可见、动作姿势完整**,绝不能拍成两人并排自拍的样子。
- 例(爸爸给水水拍照):斜后方机位——爸爸和水水在一条直线上,镜头在爸爸斜后方,能完整拍到"爸爸举着手机、对着前方的水水拍照"这个姿势(看得到爸爸举机的动作 + 前方被拍的水水)。
- composition_hint 要把这个动作关系写清楚:谁在做、对着谁、机位从哪看。

**景别**:同一种 shot 不要连续 3 页;情绪高点用 close-up,建场用 wide;但景别变化优先服务"看清表情和互动",不要为变而变。

# 角色出场密度(按剧情自然安排)
这是一本家庭绘本——一家人就应该能同框。该几个角色一起出现就画几个,
"全家一起去公园""一家人吃饭"这类温馨同框正是绘本的价值,不要回避。
按剧情自然安排每页的 characters_in_scene,以画面叙事需要为准。
(注:早期曾因 Disney/Zootopia 风格 + 狐狸兔子组合触发版权类安全过滤而限制同框人数;
现已去品牌化 + 改用小熊猫,根因消除,三角色同框已实测稳定通过,故取消该限制。)

# 写作风格
- 语言节奏短，朗朗上口
- 情感要饱满但不煽情
- 体现角色性格细节
- 不要说教，故事自己说话`;
}

export function buildStoryUserPrompt(req: StoryRequest): string {
  return `生活素材：${req.trigger}

教育目标：${req.education_goal}

请按上面"长度判断"决定页数(8-22 页),然后生成绘本。`;
}

// ━━━ Image prompt compilation ━━━

// Family-role / age words that trigger Azure safety classifier (adult+child inference).
// LLM will sometimes sneak these into composition_hint despite system-prompt rules,
// so we strip them at runtime. Detected from real moderation_blocked rejections.
function stripFamilyRoleWords(s: string): string {
  if (!s) return s;
  return s
    // English: dad/mom/parents/family/child/kid/girl/boy/etc.
    // Replace with neutral "animal character" instead of specific species —
    // earlier we used "fox/bunny" but that interferes with papa (now a red panda).
    .replace(/\b(dad|daddy|father|fatherly)\b/gi, 'animal character')
    .replace(/\b(mom|mommy|mother|motherly)\b/gi, 'animal character')
    .replace(/\b(papa|mama)\b/gi, '')
    .replace(/\b(parent|parents|family|families)\b/gi, 'animal characters')
    .replace(/\b(child|children|kid|kids|toddler|toddlers|baby|babies|infant)\b/gi, 'small animal')
    .replace(/\b(little\s+(girl|boy|kid))\b/gi, 'small animal')
    .replace(/\b(girl|boy)\b/gi, 'character')
    // Explicit ages ("3 year old", "41-year-old", "aged 5") — a precise human age next to
    // an animal character is a strong adult+minor signal. Strip the age, keep nothing.
    .replace(/\b\d{1,3}[\s-]*(year|years|yr|yrs)[\s-]*old\b/gi, '')
    .replace(/\baged?\s+\d{1,3}\b/gi, '')
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
    // 也改成中性"动物角色",不再绑定 fox/rabbit
    .replace(/(爸爸|父亲)/g, '动物角色')
    .replace(/(妈妈|母亲)/g, '动物角色')
    .replace(/(姥姥|外婆|奶奶|爷爷)/g, '动物角色')
    .replace(/(孩子|小朋友|幼儿|宝宝|小女孩|小男孩|小孩)/g, '小动物')
    .replace(/(一家三口|一家人|全家)/g, '动物角色们')
    // 中文精确年龄 ("3岁"、"3.5岁"、"41岁")——同样是成人+幼儿的强信号,直接删掉。
    .replace(/\d+(\.\d+)?\s*岁/g, '');
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

  // 机位角度 → 英文相机术语,与景别拼成完整的 Camera 描述,逼图像模型脱离"平视正面"默认。
  const angleEn = ({
    'eye-level': 'eye-level angle',
    'high-angle': 'high-angle bird\'s-eye view looking down, scene spread out below',
    'low-angle': 'low-angle looking up',
    'over-the-shoulder': 'over-the-shoulder following view',
    'from-behind': 'seen from behind, characters in foreground looking toward the scene ahead',
    'three-quarter': 'three-quarter side angle',
    'pov': 'first-person point-of-view of what the character sees',
  } as Record<string, string>)[page.camera_angle ?? 'eye-level'] ?? '';
  const cameraEn = angleEn ? `${shotEn}, ${angleEn}` : shotEn;

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
- Camera: ${cameraEn}
- Mood: ${page.emotion}

COMPOSITION: ${safeHint}

CHARACTERS:
${charBlock}

WORLD RULE: This is an all-animal world. Every character — including any background passer-by, classmate, teacher, teammate, or bystander — is an anthropomorphic ANIMAL. There are NO real humans / NO human people anywhere in the image.

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
