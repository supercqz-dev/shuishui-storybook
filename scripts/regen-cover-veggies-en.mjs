// Regen veggies book cover with Hollywood-grade English movie-poster title design.
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
const outDir = path.join(PROJ, 'assets/branding/iterations', `${date}-veggies-cover-en`);
fs.mkdirSync(outDir, { recursive: true });

const variants = [
  {
    name: 'v1-poster-classic',
    prompt: `A premium Hollywood-quality 3D animated feature film poster, Disney-Pixar level production. Portrait orientation. Centered Title text "ShuiShui's Three Bites" rendered in custom hand-crafted display lettering — bold, playful, slightly bouncy serif/script hybrid with thick strokes, warm pastel color, soft 3D bevel and inner glow, professional movie-poster typography. Below the title in smaller refined type: "A Little Family Story". Beneath the title, illustration of two anthropomorphic rabbit characters at a cozy dinner table: a small chibi-proportioned WHITE bunny toddler in a pink dress with pink floral headband and heart clip, sitting at a wooden table; next to her a slim adult anthropomorphic gray-and-white rabbit MOM character in a yellow floral knee-length dress, gently looking at the toddler. On the table: a small plate of green vegetables and a plate of red braised meat. Warm cinematic dinner lighting, soft volumetric rim light, painterly background of a cozy home interior with soft bokeh. The title text is the dominant element — about 35% of the canvas height. Spelling MUST be exactly "ShuiShui's Three Bites" — typography rendered cleanly, well-spaced, no garbled characters.`
  },
  {
    name: 'v2-poster-bold',
    prompt: `A Hollywood-grade animated film poster in portrait orientation, Disney-Pixar studio CG style. The title "ShuiShui's Three Bites" rendered in a chunky custom display typeface — extra bold rounded sans-serif with subtle 3D drop shadow, warm coral-pink color with creamy white inner highlight, professional title-card typography. Subtitle below in smaller cursive: "a tiny family bedtime story". Behind the title: a centered medium shot of two cartoon rabbit characters — a tiny chibi white bunny toddler in pink dress + pink floral headband (heart clip on band), and a slim adult gray-white anthropomorphic rabbit MOM in yellow knee-length dress with white floral pattern, sharing a warm moment at a wooden dinner table set with green vegetables and braised meat. Cozy painterly home interior background, warm cinematic dinner lighting, soft rim light. The title text is razor-sharp, large, and the dominant element. Spelling: "ShuiShui's Three Bites" — exact, well-kerned, clean and legible.`
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
        model, prompt: v.prompt, size: '1024x1536', quality: 'high', n: 1
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
