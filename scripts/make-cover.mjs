// Generate a movie-poster-style COVER with an English title rendered into the image.
// Usage: BOOK_ID=playground-redpanda-2026-05-29 TITLE="ShuiShui's Big Slide" node scripts/make-cover.mjs
//
// gpt-image-2 renders English text imperfectly → we generate N candidates; you pick the
// one with correct spelling + nice look, then set it as the book's cover_image.
// Candidates go to experiments/<date>/<book>-cover/ (gitignored); nothing is auto-promoted.
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL;
const model = process.env.IMAGE_MODEL;
const BOOK_ID = process.env.BOOK_ID;
const TITLE = process.env.TITLE;
const SCENE = process.env.SCENE ||
  'a small chibi white bunny toddler in a pink dress with pink floral headband and heart clip, sitting in a round inflatable tube beside a tall slim anthropomorphic RED PANDA in a white t-shirt and dark navy pants, at the top of a colorful outdoor rainbow tubing slide on a green grassy slope';
const N = parseInt(process.env.N || '3', 10);

if (!apiKey || !baseURL || !model) { console.error('missing env: OPENAI_API_KEY/OPENAI_BASE_URL/IMAGE_MODEL'); process.exit(1); }
if (!BOOK_ID || !TITLE) { console.error('missing BOOK_ID or TITLE env'); process.exit(1); }

const client = new OpenAI({ apiKey, baseURL });
const PROJ = path.resolve(process.cwd());
const date = new Date().toISOString().slice(0, 10);
// 候选产物落到 experiments/<date>/<book>-cover/(experiments 已 gitignore,见 experiments/README.md)
const outDir = path.join(PROJ, 'experiments', date, `${BOOK_ID}-cover`);
fs.mkdirSync(outDir, { recursive: true });

// Style anchor kept consistent with assets/bible/style.yaml so cover matches interior pages.
const STYLE = `high-end CG storybook illustration, stylized anthropomorphic animal characters with rounded soft shapes, expressive friendly faces with large warm eyes, cinematic warm golden-hour lighting with soft rim light, hand-painted picture-book background with soft brushwork and gentle bokeh, cute stylized cartoon proportions slightly large heads, fluffy textured fur, warm gentle family-friendly tone, contemporary children's book CG aesthetic`;

// ━━━ Title lettering ━━━
// 默认 'auto':不指定任何具体字体风格,让出图模型(gpt-image-2 的英文标题字体设计是专门
// 训练过的)自己设计契合该故事氛围的绘本标题——实测比我们硬描述字体更好看、更多变。
// 仍保留几个显式预设(watercolor/crayon/serif/minimal/balloon),想强制某种风格时用
// TITLE_STYLE=xxx 指定;一般情况下不要指定,交给模型。
const TITLE_STYLES = {
  auto: null, // 交给模型自由设计,prompt 里不写字体描述
  balloon: 'a custom hand-crafted playful picture-book display lettering: bold rounded letters, thick strokes, warm pastel color with soft 3D bevel and gentle inner glow, professional storybook title typography',
  watercolor: 'hand-lettered watercolor brush title typography: soft flowing brush strokes with visible bristle texture and gentle watercolor color-bleeds, slightly translucent painterly letters in warm watercolor tones, artistic and gentle like a classic hand-painted picture book',
  crayon: 'childlike hand-drawn crayon title lettering: chunky slightly uneven letters as if happily drawn by a young child with wax crayons, visible waxy crayon texture and a playful natural wobble, innocent warm and heartfelt',
  serif: 'classic storybook serif title lettering: an elegant warm serif typeface with refined tapered strokes, vintage fairytale-book feel, tasteful and timeless, in a gentle warm color',
  minimal: 'clean modern minimalist title typography: simple well-spaced rounded sans-serif letters in a single soft warm color, contemporary independent picture-book aesthetic, lots of breathing room, understated and elegant',
};
const TITLE_STYLE = process.env.TITLE_STYLE || 'auto';
if (!(TITLE_STYLE in TITLE_STYLES)) {
  console.error(`unknown TITLE_STYLE "${TITLE_STYLE}", choices: ${Object.keys(TITLE_STYLES).join(', ')}`);
  process.exit(1);
}
const titleLettering = TITLE_STYLES[TITLE_STYLE];
console.log(`title style: ${TITLE_STYLE}${titleLettering ? '' : ' (model decides)'}`);

// auto 模式:只要求一个漂亮、契合氛围、拼写正确的标题,字体设计交给模型。
const titleClause = titleLettering
  ? `rendered in ${titleLettering}. The title occupies about the top 25-30% of the canvas, well-kerned, crisp and perfectly legible`
  : `rendered as a beautiful, professionally designed children's picture-book title — choose lettering that best fits the mood of this story. The title occupies about the top 25-30% of the canvas, crisp and perfectly legible`;

// ━━━ COVER_MODE: 'classic'(默认,上面的 title+SCENE 拼法) vs 'story'(融合 GPT 建议:主题驱动 + 标题用故事元素做设计、融入插画)━━━
// story 模式采纳 GPT 思路,但保留我们的硬约束:精确拼写、锁定角色形象(SCENE)、无真人、竖版、与内页一致的风格锚点。
// 需传入 STORY_THEME(故事主题/梗概一句话),让标题字体从故事世界取材。
const COVER_MODE = process.env.COVER_MODE || 'classic';
const STORY_THEME = process.env.STORY_THEME || '';

let prompt;
if (COVER_MODE === 'story') {
  prompt = `Children's picture book cover illustration. Portrait orientation.
Story Title: "${TITLE}"
Story Theme: ${STORY_THEME}

Create a beautiful, premium, award-winning storybook cover.
The book title "${TITLE}" is integrated INTO the artwork as a custom-designed title treatment — the lettering style is uniquely inspired by THIS story: incorporate visual motifs, materials, shapes, colors and decorative elements from the story world into the title design, so the title becomes part of the illustration and helps tell the story. Make it magical, expressive, playful and handcrafted. Avoid generic fonts or plain text overlays. The title stays HIGHLY READABLE and occupies roughly the top 25-30% of the canvas.

Below / around the title, the cover illustration: ${SCENE}. Subject-centered, rich cinematic warm lighting, detailed illustration, soft bokeh background. Visual style: ${STYLE}.

HARD CONSTRAINTS (must follow exactly):
- The title spelling must be EXACTLY "${TITLE}" — clean, well-spaced letters, no garbled, missing, or extra characters. No other text anywhere on the cover.
- Keep the characters' designs EXACTLY as described in the illustration above (species, fur colors, outfits). Do not redesign them.
- This is an all-animal world: every character is an anthropomorphic animal. NO real humans anywhere.`;
} else {
  prompt = `A premium children's picture-book COVER, portrait orientation, ${STYLE}.
At the TOP of the cover, a large title text reads exactly "${TITLE}" — ${titleClause}.
Below the title, the illustration: ${SCENE}. Subject-centered, warm cinematic lighting, soft bokeh background.
CRITICAL: the title spelling must be EXACTLY "${TITLE}" — clean, well-spaced letters, no garbled or extra characters, no other text anywhere on the cover.`;
}
console.log(`cover mode: ${COVER_MODE}${COVER_MODE === 'story' ? ` (theme: ${STORY_THEME.slice(0,40)}...)` : ''}`);

fs.writeFileSync(path.join(outDir, 'cover.prompt.txt'), prompt);
console.log(`Cover for "${TITLE}" → ${N} candidates\nout: ${outDir}\n`);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let ok = 0;
for (let i = 1; i <= N; i++) {
  const ts = new Date().toISOString();
  process.stdout.write(`[cover #${i}] ${ts}... `);
  try {
    const r = await client.images.generate({ model, prompt, size: '1024x1536', quality: 'high', n: 1 });
    const b64 = r.data?.[0]?.b64_json;
    if (b64) {
      const tag = COVER_MODE === 'story' ? 'story' : TITLE_STYLE;
      const out = path.join(outDir, `cover-${tag}-${i}.png`);
      fs.writeFileSync(out, Buffer.from(b64, 'base64'));
      process.stdout.write(`SUCCESS → ${out}\n`);
      ok++;
    } else { process.stdout.write('no-b64\n'); }
  } catch (e) {
    const msg = e?.message || String(e);
    const code = (msg.match(/"code":\s*"([^"]+)"/) || [])[1] || (msg.includes('moderation') ? 'moderation' : 'err');
    process.stdout.write(`FAIL(${code})\n`);
  }
  await sleep(3000);
}
console.log(`\nDone. ${ok}/${N} candidates in ${outDir}/`);
