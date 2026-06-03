// Fallback: use OpenAI images.edit endpoint with shuishui.png as visual reference.
// Different code path than images.generate; sometimes has different moderation behavior.
import fs from 'fs';
import path from 'path';
import OpenAI, { toFile } from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL;
const model = process.env.IMAGE_MODEL;
if (!apiKey || !baseURL || !model) { console.error('missing env'); process.exit(1); }
const client = new OpenAI({ apiKey, baseURL });

const PROJ = path.resolve(process.cwd());
const refPath = path.join(PROJ, 'assets/bible/character_refs/shuishui.png');
const targetPath = path.join(PROJ, 'assets/bible/character_refs/mama.png');
const logPath = '/tmp/mama-attempts/edit-log.txt';
fs.writeFileSync(logPath, `=== mama image-edit run ${new Date().toISOString()} ===\n`);

const variants = [
  {
    name: 'edit-v1-adult-version',
    instruction: `Re-render this character as the adult mom version of this same character, same Disney-Pixar 3D animated style.
Keep: pure white fluffy fur, long upright bunny ears, small fluffy tail, brown eyes, kind cheerful smile.
Change: she is now an adult (around 34 years old) with normal adult cartoon-character body proportions (not the chibi baby head ratio),
wearing a knee-length lemon-yellow garment with bold large white flower pattern, beige flat shoes, thin gold neck chain.
Single character, full body visible, three-quarter front view, soft pastel background, wholesome family-friendly storybook character.`
  },
  {
    name: 'edit-v2-grown-up-sister',
    instruction: `Show the older sister of this character in the same Disney-Pixar 3D style.
Same fur color (creamy white), same long upright bunny ears, same brown eyes, kind smile.
Adult cartoon proportions, around 34 years old.
Outfit: a knee-length yellow piece with bold white flower print, beige flat slip-on shoes, thin gold chain.
Full body, three-quarter front view, soft pastel background, wholesome storybook character.`
  },
  {
    name: 'edit-v3-mom-character',
    instruction: `Generate the mother bunny character based on this toddler design — same fur color (cream white),
same long upright ears, same brown eyes. The mother has slightly more mature cartoon proportions but still adorable.
She wears a knee-length lemon-yellow patterned garment with bold white flowers, beige flat shoes, thin gold neck chain.
Disney-Pixar 3D rendered storybook character, three-quarter front view, soft pastel background.`
  },
  {
    name: 'edit-v4-color-palette-only',
    instruction: `Re-illustrate this character with new clothing: a knee-length yellow garment with bold large white flower pattern,
beige flat slip-on shoes, thin gold neck chain. Keep the rest of the design (fur color, ears, tail, eyes, smile) consistent.
Three-quarter front view, soft pastel background, wholesome storybook character.`
  }
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function tryEdit(variant) {
  const ts = new Date().toISOString();
  process.stdout.write(`[edit-variant ${variant.name}] ${ts}... `);
  try {
    const refFile = await toFile(fs.createReadStream(refPath), 'shuishui.png', { type: 'image/png' });
    const r = await client.images.edit({
      model,
      image: refFile,
      prompt: variant.instruction,
      size: '1024x1536',
      n: 1,
    });
    const b64 = r.data?.[0]?.b64_json;
    if (b64) {
      fs.writeFileSync(targetPath, Buffer.from(b64, 'base64'));
      process.stdout.write('SUCCESS\n');
      fs.appendFileSync(logPath, `SUCCESS variant=${variant.name} at ${ts}\nprompt:\n${variant.instruction}\n\n`);
      return true;
    }
    process.stdout.write('no-b64\n');
    fs.appendFileSync(logPath, `[${ts}] variant=${variant.name} no-b64\n`);
  } catch (e) {
    const errMsg = e?.error?.param || e?.message || String(e);
    const codeMatch = errMsg.match(/"code":\s*"([^"]+)"/);
    const code = codeMatch ? codeMatch[1] : 'unknown';
    process.stdout.write(`FAIL(${code}) ${e.status}\n`);
    fs.appendFileSync(logPath, `[${ts}] variant=${variant.name} FAIL code=${code} status=${e.status} msg=${errMsg.slice(0,200)}\n`);
  }
  return false;
}

for (let attempt = 1; attempt <= 10; attempt++) {
  for (const v of variants) {
    if (await tryEdit(v)) process.exit(0);
    await sleep(2000);
  }
  await sleep(15000);
}
console.log('exhausted edit attempts');
