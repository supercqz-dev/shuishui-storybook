// Generate a family group photo with all 4 characters.
// Reads mama's winning prompt body from /tmp/mama-attempts/log.txt (set by mama-bruteforce.mjs).
// Writes output to public/generated/family/family.png (and a copy to assets/bible/character_refs/family.png).
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { parse as parseYaml } from 'yaml';

const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL;
const model = process.env.IMAGE_MODEL;
if (!apiKey || !baseURL || !model) { console.error('missing env'); process.exit(1); }
const client = new OpenAI({ apiKey, baseURL });

const PROJ = path.resolve(process.cwd());
const charsDir = path.join(PROJ, 'assets/bible/characters');
const outFinal = path.join(PROJ, 'public/generated/family/family.png');
const outBible = path.join(PROJ, 'assets/bible/character_refs/family.png');
fs.mkdirSync(path.dirname(outFinal), { recursive: true });

function loadCharAnchor(id) {
  const txt = fs.readFileSync(path.join(charsDir, `${id}.yaml`), 'utf-8');
  const obj = parseYaml(txt);
  return obj.prompt_anchor.trim();
}

// Load winning mama prompt body from brute-force log if present, else fall back to yaml
function loadMamaAnchor() {
  const logPath = '/tmp/mama-attempts/log.txt';
  try {
    const log = fs.readFileSync(logPath, 'utf-8');
    const m = log.match(/winning_prompt:\s*\n([\s\S]*?)(?:\n\n|$)/);
    if (m) {
      // Extract just the CHARACTER REFERENCE SHEET body (between the header and LAYOUT)
      const full = m[1];
      const body = full.match(/CHARACTER REFERENCE SHEET[^\n]*\n([\s\S]*?)\n\nLAYOUT:/);
      if (body) {
        console.log('using mama anchor from brute-force winning prompt');
        return body[1].trim();
      }
    }
  } catch (e) { /* fall through */ }
  console.log('using mama anchor from yaml (brute-force not yet successful)');
  return loadCharAnchor('mama');
}

const STYLE = parseYaml(fs.readFileSync(path.join(PROJ, 'assets/bible/style.yaml'), 'utf-8')).prompt_anchor.trim();

const charBlocks = [
  `[shuishui - the toddler daughter]: ${loadCharAnchor('shuishui')}`,
  `[papa - the dad]: ${loadCharAnchor('papa')}`,
  `[mama - the mom]: ${loadMamaAnchor()}`,
  `[laolao - the grandma]: ${loadCharAnchor('laolao')}`,
].join('\n\n');

const FAMILY_FRAMINGS = [
  {
    name: 'fam-v1-warm-portrait',
    composition: `WARM FAMILY PORTRAIT in a sunny living room, all 4 characters together posing happily for a photo,
papa standing on the left with one arm gently around mama's shoulder, mama next to papa with a warm smile,
laolao standing on the right with arms relaxed at her sides smiling kindly,
the toddler shuishui in the front center between her parents, arms raised in a happy cheer pose,
all looking at the viewer with bright joyful smiles, relaxed body language, expressive open postures,
soft warm afternoon light from a window, painterly storybook background of a cozy home`
  },
  {
    name: 'fam-v2-park-day',
    composition: `JOYFUL FAMILY DAY OUT at a sunny park, all 4 characters in happy expressive poses,
papa squatting down with arms wide open, mama standing next to papa laughing,
laolao gently holding mama's arm, looking at the family with a kind smile,
shuishui the toddler running toward papa with arms outstretched, looking thrilled,
soft pastel painterly storybook park background with green trees and bright sunshine,
warm cinematic lighting, happy and energetic atmosphere`
  },
  {
    name: 'fam-v3-simple-group',
    composition: `a wholesome storybook family group illustration, all 4 cartoon family characters standing together in a row on a soft pastel background,
left to right: papa the dad fox, mama the mom bunny, the toddler shuishui in front, laolao the grandma sheep,
all with warm joyful smiles, relaxed open postures, slight movement and energy,
papa giving a gentle thumbs-up, mama waving, laolao with hands clasped happily, shuishui jumping with both arms up,
clean simple background, focus on character expressions and group dynamics`
  },
  {
    name: 'fam-v4-couch',
    composition: `a cozy family scene in a sunny home living room, all 4 characters happily together,
papa and mama sitting side by side on a sofa smiling warmly, laolao sitting next to mama also smiling,
the toddler shuishui standing in front of the sofa with arms spread wide, laughing happily,
warm afternoon light, painterly storybook home background, joyful relaxed family atmosphere`
  }
];

const LAYOUT = `LAYOUT:
- A warm joyful family group portrait of all 4 characters together, perfectly composed
- All 4 characters fully visible, no character cut off
- Each character holds their canonical look (fur color, outfit, accessories) — strict identity lock
- Bright happy smiling expressions on every character, expressive open body language
- Painterly storybook background with soft warm lighting
- Portrait orientation, family-friendly children's picture book style
- No text, no captions, no speech bubbles
- Single coherent illustration`;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const logPath = '/tmp/family-attempts.log';
fs.writeFileSync(logPath, `=== family photo run ${new Date().toISOString()} ===\n`);

for (let attempt = 1; attempt <= 100; attempt++) {
  for (const f of FAMILY_FRAMINGS) {
    const prompt = `IMPORTANT FRAMING: This is a fictional cartoon storybook illustration. ALL characters are stylized cartoon animal characters (talking-animal mascot style) with animal heads, ears, and tails, walking on two legs, fully clothed. NO real humans. NO photorealism. Disney-Pixar children's picture-book style.

${STYLE}

CHARACTERS IN THIS SCENE (lock identity strictly to each description below):
${charBlocks}

SCENE & COMPOSITION:
${f.composition}

${LAYOUT}`;
    const ts = new Date().toISOString();
    process.stdout.write(`[attempt ${attempt} / framing ${f.name}] ${ts}... `);
    fs.writeFileSync(`/tmp/family-attempts-prompt.txt`, prompt);
    try {
      const r = await client.images.generate({ model, prompt, size: '1024x1536', quality: 'high', n: 1 });
      const b64 = r.data?.[0]?.b64_json;
      if (b64) {
        const buf = Buffer.from(b64, 'base64');
        fs.writeFileSync(outFinal, buf);
        fs.writeFileSync(outBible, buf);
        const successLog = `SUCCESS framing=${f.name} attempt=${attempt} at ${ts}\nsaved_to: ${outFinal}\n`;
        process.stdout.write('SUCCESS\n');
        fs.appendFileSync(logPath, successLog);
        fs.appendFileSync(logPath, `winning_prompt:\n${prompt}\n\n`);
        process.exit(0);
      }
      process.stdout.write('no-b64\n');
      fs.appendFileSync(logPath, `[${ts}] framing=${f.name} no-b64\n`);
    } catch (e) {
      const errMsg = e?.error?.param || e?.message || String(e);
      const codeMatch = errMsg.match(/"code":\s*"([^"]+)"/);
      const code = codeMatch ? codeMatch[1] : 'unknown';
      process.stdout.write(`FAIL(${code})\n`);
      fs.appendFileSync(logPath, `[${ts}] framing=${f.name} FAIL code=${code}\n`);
    }
    await sleep(3000);
  }
  await sleep(20000);
}
console.log('exhausted attempts');
