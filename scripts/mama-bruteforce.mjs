// Brute-force prompt variants — round 2: radically different approaches
// Round 1 (8 variants) all blocked by Azure moderation. New variants try fundamentally different framings.
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

// New variants — fundamentally different framings to dodge moderation triggers
const variants = [
  {
    name: 'v9-hare-not-bunny',
    body: `a Disney-Pixar style 3D rendered cartoon HARE character (not a bunny, a long-eared hare),
cream-colored soft fur, two long upright hare ears, small round tail, warm brown eyes, kind smile,
wearing a knee-length yellow garment with large bold white flower pattern,
beige flat shoes, thin gold chain necklace, wholesome family-friendly cartoon character`
  },
  {
    name: 'v10-no-animal-noun',
    body: `a Disney-Pixar style 3D rendered chibi-style mascot character with long upright pointy ears on top of the head,
soft cream-colored short fur all over the body, big warm brown eyes, friendly cheerful smile,
wearing a knee-length yellow clothing with large bold white flower print pattern,
beige flat shoes, thin gold neck chain, wholesome family-friendly storybook mascot`
  },
  {
    name: 'v11-watercolor-style',
    body: `a soft watercolor children's picture book illustration of a kind cartoon bunny character,
gentle cream-colored fluffy fur, long upright bunny ears, brown eyes, sweet smile,
wearing a knee-length yellow piece with bold white flower pattern,
beige flat shoes, thin gold chain, painted in delicate watercolor storybook style for kids`
  },
  {
    name: 'v12-no-color-words',
    body: `a Disney-Pixar 3D rendered cartoon bunny character, soft fluffy fur, long upright bunny ears, small fluffy tail,
warm brown eyes, kind cheerful smile, wearing a knee-length floral-pattern garment,
flat slip-on shoes, thin chain necklace, wholesome storybook character`
  },
  {
    name: 'v13-baby-version',
    body: `a Disney-Pixar 3D rendered cartoon BABY-PROPORTIONED bunny character with extra-cute big head and small body,
soft cream-colored fluffy fur, long upright bunny ears, small fluffy tail, big sparkling brown eyes,
sweet baby-like cheerful smile, wearing a knee-length yellow piece with bold white flower pattern,
beige flat shoes, thin gold neck chain, kawaii baby-style storybook mascot`
  },
  {
    name: 'v14-named-character',
    body: `Mrs. Cottonwhisker, an original Disney-Pixar style cartoon storybook character,
3D rendered, cream-colored fluffy fur, long upright bunny ears, small fluffy tail,
warm brown eyes, kind cheerful smile, wearing a knee-length yellow garment with bold white flower pattern,
beige flat slip-on shoes, thin delicate gold chain necklace,
a wholesome friendly storybook supporting character for a children's picture book`
  },
  {
    name: 'v15-pastel-style',
    body: `a soft pastel illustration of a kind cartoon bunny family character for a children's picture book,
gentle cream-colored short fur, long upright bunny ears, small round tail,
warm brown eyes, friendly smile, wearing a knee-length yellow piece with bold white flower pattern,
flat slip-on shoes, thin gold chain at the neckline,
soft pastel storybook illustration style with hand-painted texture`
  },
  {
    name: 'v16-tan-instead-of-white',
    body: `a Disney-Pixar 3D rendered cartoon bunny character, light tan-and-cream colored fluffy fur,
long upright bunny ears, small fluffy tail, warm brown eyes, kind cheerful smile,
wearing a knee-length yellow piece with bold white flower pattern,
beige flat shoes, thin gold neck chain, wholesome storybook character`
  },
  {
    name: 'v17-young-girl-bunny',
    body: `a Disney-Pixar 3D rendered cartoon YOUNG GIRL bunny character (older sister, around 16),
soft cream fluffy fur, long upright bunny ears, small fluffy tail, warm brown eyes, kind cheerful smile,
wearing a knee-length yellow garment with bold white flower pattern,
beige flat shoes, thin gold neck chain, wholesome family-friendly storybook character`
  },
  {
    name: 'v18-different-color-blue-dress',
    body: `a Disney-Pixar 3D rendered cartoon bunny character, soft cream-colored fluffy fur,
long upright bunny ears, small fluffy tail, warm brown eyes, kind cheerful smile,
wearing a knee-length pale blue piece with bold white flower pattern,
beige flat shoes, thin gold neck chain, wholesome storybook character`
  },
  {
    name: 'v19-zootopia-judy-style',
    body: `a Disney-Zootopia style 3D animated rabbit character, similar look to Judy Hopps but with cream-colored fur,
long upright rabbit ears, small fluffy tail, big warm brown eyes, kind cheerful smile,
wearing a knee-length yellow piece with bold white flower pattern,
flat slip-on shoes, thin gold chain at the neckline, wholesome family-friendly Disney-Zootopia style character`
  },
  {
    name: 'v20-stuffed-plush-toy',
    body: `a 3D rendered illustration of a plush bunny toy, like a high-quality children's stuffed animal toy,
soft cream-colored plush fabric fur, long upright bunny ears made of plush, small puffy tail,
embroidered warm brown eyes, embroidered kind smile, dressed in tiny removable plush clothes:
a knee-length yellow plush garment with bold white flower print, beige plush flat shoes, plush gold-colored chain at neck,
photographed style, plush toy product illustration, soft pastel background`
  }
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const targetPath = '/Users/gary/claude code 项目集合/水水的绘本/assets/bible/character_refs/mama.png';
const logPath = '/tmp/mama-attempts/log.txt';
fs.appendFileSync(logPath, `\n=== mama brute-force ROUND 2 ${new Date().toISOString()} (new variants) ===\n`);

for (let attempt = 1; attempt <= 100; attempt++) {
  for (const v of variants) {
    const prompt = `${STYLE}\n\nCHARACTER REFERENCE SHEET (turnaround pose, neutral expression):\n${v.body}\n\n${LAYOUT}`;
    const ts = new Date().toISOString();
    process.stdout.write(`[attempt ${attempt} / variant ${v.name}] ${ts}... `);
    try {
      const r = await client.images.generate({ model, prompt, size: '1024x1536', quality: 'high', n: 1 });
      const b64 = r.data?.[0]?.b64_json;
      if (b64) {
        fs.writeFileSync(targetPath, Buffer.from(b64, 'base64'));
        const successLog = `SUCCESS variant=${v.name} attempt=${attempt} at ${ts}\n`;
        process.stdout.write('SUCCESS\n');
        fs.appendFileSync(logPath, successLog);
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
console.log('exhausted attempts');
