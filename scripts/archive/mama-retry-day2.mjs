// Day 2 retry: Azure today is stricter than yesterday.
// Test 1: same v10 winning prompt 5x to confirm stochasticity
// Test 2: new variants applying guide principles + minimal text strategy
import fs from 'fs';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL;
const model = process.env.IMAGE_MODEL;
if (!apiKey || !baseURL || !model) { console.error('missing env'); process.exit(1); }
const client = new OpenAI({ apiKey, baseURL });

const STYLE = `modern 3D animated feature film aesthetic,
stylized cartoon characters with expressive faces,
cinematic warm lighting with soft rim light,
painterly storybook background, soft brushwork environments,
clean clear silhouettes, vibrant but harmonious palette,
subject-centered framing, stylized cartoon proportions, slightly large heads,
high-quality storybook illustration in contemporary studio CG style`;

const LAYOUT = `LAYOUT:
- Single character standing centered, full body visible
- Plain soft pastel background, no other characters or props
- Three-quarter front view
- Friendly cheerful expression
- Studio character-design lighting (clean, even)
- Portrait orientation
- This is a CHARACTER MODEL SHEET used for downstream consistency`;

// Mix of strategies. Each variant tests a different hypothesis about what's blocking.
const variants = [
  {
    name: 'd2-v1-yesterday-winner',
    body: `a Disney-Pixar style 3D rendered chibi-style mascot character with long upright pointy ears on top of the head,
soft cream-colored short fur all over the body, big warm brown eyes, friendly cheerful smile,
wearing a knee-length yellow clothing with large bold white flower print pattern,
beige flat shoes, thin gold neck chain, wholesome family-friendly storybook mascot`
  },
  {
    name: 'd2-v2-ultra-minimal',
    body: `a cute cartoon mascot character with long pointed ears, cream colored,
in a yellow patterned outfit with white flowers, beige shoes, gold chain,
3D animated style, cheerful smile`
  },
  {
    name: 'd2-v3-plushie-product',
    body: `a 3D rendered illustration of a high-quality children's plushie toy product,
shaped like a friendly mascot with long upright pointed plush ears on top,
cream-colored soft plush fabric all over, embroidered warm brown eyes, embroidered cheerful smile,
the plushie wears a tiny knee-length yellow plush outfit with bold white flower pattern,
plush beige slip-on shoes, a tiny plush gold-colored neck chain,
catalog-style product illustration on a soft pastel background`
  },
  {
    name: 'd2-v4-no-fur',
    body: `a 3D rendered cartoon mascot character with long upright pointed ears on top of the head,
smooth cream-colored skin, big warm brown eyes, friendly cheerful smile,
wearing a knee-length yellow patterned outfit with bold white flower print,
beige flat shoes, a thin gold neck chain,
modern 3D animated cartoon style, contemporary studio CG look,
wholesome family-friendly storybook mascot character`
  },
  {
    name: 'd2-v5-no-pointed-ears',
    body: `a 3D rendered cartoon mascot character with two tall ear-shaped ornaments on top of the head,
soft cream-colored short fur, big warm brown eyes, friendly cheerful smile,
wearing a knee-length yellow patterned outfit with bold white flower print,
beige flat shoes, a thin gold neck chain,
modern 3D animated cartoon style, contemporary studio CG look,
wholesome family-friendly storybook mascot character`
  },
  {
    name: 'd2-v6-elder-version',
    body: `a 3D rendered cartoon elderly mascot character with long upright pointy ears on top of the head,
soft cream-colored short fur all over the body, gentle wise eyes, friendly grandmother smile,
wearing a knee-length yellow clothing with large bold white flower print pattern,
beige flat shoes, thin gold neck chain, wholesome family-friendly storybook mascot character`
  },
  {
    name: 'd2-v7-standing-tall',
    body: `a Disney-Pixar style 3D rendered cartoon mascot character with long upright pointy ears on top of the head,
soft cream-colored short fur all over the body, big warm brown eyes, friendly cheerful smile,
standing tall with a graceful posture (taller than a child but with cartoon proportions),
wearing a knee-length yellow clothing with large bold white flower print pattern,
beige flat shoes, thin gold neck chain, wholesome family-friendly storybook mascot character`
  }
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const targetPath = '/Users/gary/claude code 项目集合/水水的绘本/assets/bible/character_refs/mama.png';
const logPath = '/tmp/mama-attempts/day2-log.txt';
fs.mkdirSync('/tmp/mama-attempts', { recursive: true });
fs.writeFileSync(logPath, `=== mama day-2 retry ${new Date().toISOString()} ===\n`);

for (let attempt = 1; attempt <= 50; attempt++) {
  for (const v of variants) {
    const prompt = `${STYLE}\n\nCHARACTER REFERENCE SHEET (turnaround pose, neutral expression):\n${v.body}\n\n${LAYOUT}`;
    const ts = new Date().toISOString();
    process.stdout.write(`[A${attempt} V=${v.name}] ${ts}... `);
    try {
      const r = await client.images.generate({ model, prompt, size: '1024x1536', quality: 'high', n: 1 });
      const b64 = r.data?.[0]?.b64_json;
      if (b64) {
        fs.writeFileSync(targetPath, Buffer.from(b64, 'base64'));
        process.stdout.write('SUCCESS\n');
        fs.appendFileSync(logPath, `SUCCESS variant=${v.name} attempt=${attempt} at ${ts}\n`);
        fs.appendFileSync(logPath, `winning_prompt:\n${prompt}\n\n`);
        process.exit(0);
      }
      process.stdout.write('no-b64\n');
      fs.appendFileSync(logPath, `[${ts}] variant=${v.name} no-b64\n`);
    } catch (e) {
      const errMsg = e?.error?.param || e?.message || String(e);
      const codeMatch = errMsg.match(/"code":\s*"([^"]+)"/);
      const code = codeMatch ? codeMatch[1] : 'unknown';
      process.stdout.write(`FAIL(${code})\n`);
      fs.appendFileSync(logPath, `[${ts}] variant=${v.name} FAIL code=${code}\n`);
    }
    await sleep(2000);
  }
  await sleep(15000);
}
console.log('exhausted');
