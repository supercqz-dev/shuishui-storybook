// Step-up test: starting from the ultra-minimal winning prompt,
// add ONE feature at a time and observe which additions still pass moderation.
// User insight (2026-05-27): "rabbit" 比 "bunny" 中性,可能不在 Layer 1 黑名单。
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

// Each variant tests ONE additional feature on top of the minimal winner.
// We rank by how desirable the result would be IF it passed.
const variants = [
  // baseline (already passed once, used as control)
  {
    name: 'su-baseline',
    body: `a cute cartoon mascot character with long pointed ears, cream colored,
in a yellow patterned outfit with white flowers, beige shoes, gold chain,
3D animated style, cheerful smile`
  },
  // +rabbit identity (highest priority per user)
  {
    name: 'su-rabbit',
    body: `a cute cartoon rabbit mascot character with long pointed ears, cream colored,
in a yellow patterned outfit with white flowers, beige shoes, gold chain,
3D animated style, cheerful smile`
  },
  // +rabbit + dress
  {
    name: 'su-rabbit-dress',
    body: `a cute cartoon rabbit mascot character with long pointed ears, cream colored,
in a knee-length yellow dress with white flowers, beige shoes, gold chain,
3D animated style, cheerful smile`
  },
  // +rabbit + large flowers
  {
    name: 'su-rabbit-bigflowers',
    body: `a cute cartoon rabbit mascot character with long pointed ears, cream colored,
in a yellow outfit with large bold white flowers, beige shoes, gold chain,
3D animated style, cheerful smile`
  },
  // +rabbit + adult
  {
    name: 'su-rabbit-adult',
    body: `a cute cartoon adult rabbit mom character with long pointed ears, cream colored,
in a yellow patterned outfit with white flowers, beige shoes, gold chain,
3D animated style, cheerful smile`
  },
  // +rabbit + pure white
  {
    name: 'su-rabbit-white',
    body: `a cute cartoon rabbit mascot character with long pointed ears, pure white colored,
in a yellow patterned outfit with white flowers, beige shoes, gold chain,
3D animated style, cheerful smile`
  },
  // +rabbit + dress + large flowers (fuller version)
  {
    name: 'su-rabbit-dress-bigflowers',
    body: `a cute cartoon rabbit mascot character with long pointed ears, cream colored,
in a knee-length yellow dress with large bold white flowers, beige shoes, gold chain,
3D animated style, cheerful smile`
  },
  // +rabbit + everything (the dream version)
  {
    name: 'su-rabbit-full',
    body: `a cute cartoon adult rabbit mom character with long pointed ears, pure white colored,
in a knee-length lemon yellow dress with large bold white flowers, beige shoes, gold chain,
3D animated style, cheerful smile`
  }
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const targetPath = '/Users/gary/claude code 项目集合/水水的绘本/assets/bible/character_refs/mama.png';
const logPath = '/tmp/mama-attempts/stepup-log.txt';
const outDir = '/tmp/mama-attempts/stepup-imgs';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(logPath, `=== mama step-up ${new Date().toISOString()} ===\n`);

// Track which variants have passed at least once (we save those images)
const passed = new Map();

// Strategy: for each variant, try 3 times. Save image of first success per variant.
// At the end, we pick the BEST variant that passed.
const ATTEMPTS_PER_VARIANT = 3;

for (const v of variants) {
  for (let i = 1; i <= ATTEMPTS_PER_VARIANT; i++) {
    if (passed.has(v.name)) break;
    const prompt = `${STYLE}\n\nCHARACTER REFERENCE SHEET (turnaround pose, neutral expression):\n${v.body}\n\n${LAYOUT}`;
    const ts = new Date().toISOString();
    process.stdout.write(`[${v.name} #${i}] ${ts}... `);
    try {
      const r = await client.images.generate({ model, prompt, size: '1024x1536', quality: 'high', n: 1 });
      const b64 = r.data?.[0]?.b64_json;
      if (b64) {
        const imgPath = `${outDir}/${v.name}.png`;
        fs.writeFileSync(imgPath, Buffer.from(b64, 'base64'));
        passed.set(v.name, { attempt: i, ts, img: imgPath, prompt });
        process.stdout.write(`SUCCESS → ${imgPath}\n`);
        fs.appendFileSync(logPath, `SUCCESS variant=${v.name} attempt=${i} at ${ts} → ${imgPath}\n`);
        break;
      }
      process.stdout.write('no-b64\n');
    } catch (e) {
      const errMsg = e?.error?.param || e?.message || String(e);
      const codeMatch = errMsg.match(/"code":\s*"([^"]+)"/);
      const code = codeMatch ? codeMatch[1] : 'unknown';
      process.stdout.write(`FAIL(${code})\n`);
      fs.appendFileSync(logPath, `[${ts}] variant=${v.name} attempt=${i} FAIL code=${code}\n`);
    }
    await sleep(2000);
  }
  await sleep(3000);
}

// Summary: pick the most-feature-loaded variant that passed.
// Order matters: variants are listed from least → most ambitious.
// The LAST passing variant in order is the best result.
const passOrder = variants.map(v => v.name).filter(n => passed.has(n));
const bestVariant = passOrder[passOrder.length - 1];
fs.appendFileSync(logPath, `\n=== SUMMARY ===\nPassed variants: ${passOrder.join(', ')}\nBest (most-loaded that passed): ${bestVariant}\n`);

if (bestVariant) {
  const best = passed.get(bestVariant);
  fs.copyFileSync(best.img, targetPath);
  fs.appendFileSync(logPath, `Saved ${bestVariant} as mama.png\nwinning_prompt:\n${best.prompt}\n`);
  console.log(`\nSAVED ${bestVariant} as mama.png`);
} else {
  console.log('\nNothing passed — keeping existing mama.png');
}
