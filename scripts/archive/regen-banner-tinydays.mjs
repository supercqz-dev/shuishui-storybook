// Regen library banner with new title "Tiny Days" — 2 versions:
//   A. with background that structurally bleeds into the bookshelf below (like a wooden shelf edge / table surface)
//   B. minimal white background
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL;
const model = process.env.IMAGE_MODEL;
if (!apiKey || !baseURL || !model) { console.error('missing env'); process.exit(1); }
const client = new OpenAI({ apiKey, baseURL });

const PROJ = path.resolve(process.cwd());
const date = new Date().toISOString().slice(0, 10);
const outDir = path.join(PROJ, 'assets/branding/iterations', `${date}-tinydays-banner`);
fs.mkdirSync(outDir, { recursive: true });

const variants = [
  {
    name: 'A-scene-shelf',
    size: '1536x1024',
    prompt: `A premium children's storybook brand banner, landscape orientation. Centered title "Tiny Days" rendered in elegant custom display lettering — refined hand-drawn serif/script hybrid with subtle 3D depth, warm cream-pink gradient color, professional brand-identity typography, clean kerning. Below the title in delicate lighter-weight type: "every little moment, a story". Behind the title: a softly-lit cozy children's reading nook scene — a wooden bookshelf top in the background with a few decorative storybooks, a couple of soft plush bunnies, dried flowers in a small vase, sunlight from a window, painterly background slightly out of focus. The IMPORTANT structural detail: the BOTTOM EDGE of the banner shows the FRONT EDGE of a soft wooden shelf surface (or a creamy linen tablecloth), like a real bookshelf the viewer is looking at — so when the banner sits above a list of book covers below, the books visually appear to be resting ON this shelf surface, creating a natural diorama-like transition (NOT a gradient, NOT a hard line — a real-world structural edge). Disney-Pixar 3D rendered storybook brand aesthetic, warm cinematic lighting, harmonious cream-pink palette. Spelling: exactly "Tiny Days" — large, dominant, well-rendered.`
  },
  {
    name: 'B-minimal-white',
    size: '1536x1024',
    prompt: `A minimal premium children's storybook brand banner, landscape orientation, on a clean PURE WHITE background (no scene, no clutter). Centered title "Tiny Days" rendered in elegant custom display lettering — refined hand-drawn serif/script hybrid, soft 3D bevel, warm cream-pink gradient color with subtle shadow, professional brand-identity typography, careful kerning. Below the title in smaller delicate lighter-weight cursive: "every little moment, a story". A few minimal decorative accents around the title — perhaps a tiny watercolor leaf, a small heart, a sleeping plush bunny silhouette in soft pastel — extremely sparse and elegant, brand-magazine quality. The lower portion of the banner is CLEAN WHITE so when this banner sits above a white book grid, the transition is seamless. Disney-Pixar level CG rendering quality but minimal composition. Spelling: exactly "Tiny Days" — well-rendered, beautiful typography.`
  }
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

for (const v of variants) {
  fs.writeFileSync(path.join(outDir, `${v.name}.prompt.txt`), v.prompt);
  for (let i = 1; i <= 2; i++) {
    const ts = new Date().toISOString();
    process.stdout.write(`[${v.name} #${i}] ${ts}... `);
    try {
      const r = await client.images.generate({
        model, prompt: v.prompt, size: v.size, quality: 'high', n: 1
      });
      const b64 = r.data?.[0]?.b64_json;
      if (b64) {
        const out = path.join(outDir, `${v.name}-attempt-${i}.png`);
        fs.writeFileSync(out, Buffer.from(b64, 'base64'));
        process.stdout.write(`SUCCESS → ${out}\n`);
        break;
      }
      process.stdout.write('no-b64\n');
    } catch (e) {
      const errMsg = e?.error?.param || e?.message || String(e);
      const codeMatch = errMsg.match(/"code":\s*"([^"]+)"/);
      const code = codeMatch ? codeMatch[1] : 'unknown';
      process.stdout.write(`FAIL(${code})\n`);
    }
    await sleep(3000);
  }
}
console.log(`\nDone. See ${outDir}/`);
