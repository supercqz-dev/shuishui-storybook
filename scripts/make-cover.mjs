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

// ━━━ Title lettering styles ━━━
// 标题字体不该千篇一律——按题材挑。选择用 TITLE_STYLE 环境变量(默认 balloon,向后兼容旧封面)。
// 题材→风格推荐(经验值,可灵活):
//   · 欢快/玩水/玩耍/夏天   → watercolor(水彩跟水/清新呼应) 或 balloon
//   · 温情/家人/睡前/情绪   → crayon(稚拙温暖) 或 serif
//   · 自然/成长/种植/季节   → watercolor 或 serif
//   · 知识/探索/观察(蚂蚁) → minimal(干净) 或 serif
//   · 节日/热闹/惊喜        → balloon(热闹甜)
const TITLE_STYLES = {
  // 现状:粗圆气球立体字,热闹但偏甜腻
  balloon: 'a custom hand-crafted playful picture-book display lettering: bold rounded letters, thick strokes, warm pastel color with soft 3D bevel and gentle inner glow, professional storybook title typography',
  // 手写水彩笔刷:文艺、灵动、有笔触和水痕,跟"水/雨/自然"题材最搭
  watercolor: 'hand-lettered watercolor brush title typography: soft flowing brush strokes with visible bristle texture and gentle watercolor color-bleeds, slightly translucent painterly letters in warm watercolor tones, artistic and gentle like a classic hand-painted picture book',
  // 蜡笔/儿童涂鸦:稚拙天真,像孩子自己写的,温暖不完美
  crayon: 'childlike hand-drawn crayon title lettering: chunky slightly uneven letters as if happily drawn by a young child with wax crayons, visible waxy crayon texture and a playful natural wobble, innocent warm and heartfelt',
  // 经典衬线:复古童话书,稳重有格调,不甜腻
  serif: 'classic storybook serif title lettering: an elegant warm serif typeface with refined tapered strokes, vintage fairytale-book feel, tasteful and timeless, in a gentle warm color',
  // 现代极简无衬线:当代独立绘本,干净、高级、留白多
  minimal: 'clean modern minimalist title typography: simple well-spaced rounded sans-serif letters in a single soft warm color, contemporary independent picture-book aesthetic, lots of breathing room, understated and elegant',
};
const TITLE_STYLE = process.env.TITLE_STYLE || 'balloon';
const titleLettering = TITLE_STYLES[TITLE_STYLE];
if (!titleLettering) {
  console.error(`unknown TITLE_STYLE "${TITLE_STYLE}", choices: ${Object.keys(TITLE_STYLES).join(', ')}`);
  process.exit(1);
}
console.log(`title style: ${TITLE_STYLE}`);

const prompt = `A premium children's picture-book COVER, portrait orientation, ${STYLE}.
At the TOP of the cover, a large title text reads exactly "${TITLE}" — rendered in ${titleLettering}. The title occupies about the top 25-30% of the canvas, well-kerned, crisp and perfectly legible.
Below the title, the illustration: ${SCENE}. Subject-centered, warm cinematic lighting, soft bokeh background.
CRITICAL: the title spelling must be EXACTLY "${TITLE}" — clean, well-spaced letters, no garbled or extra characters, no other text anywhere on the cover.`;

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
      const out = path.join(outDir, `cover-${TITLE_STYLE}-${i}.png`);
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
