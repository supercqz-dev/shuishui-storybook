// One-off test: user-provided Chinese prompt from GPT.
// Saves all results to iterations/, never overwrites canonical.
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL;
const model = process.env.IMAGE_MODEL;
if (!apiKey || !baseURL || !model) { console.error('missing env'); process.exit(1); }
const client = new OpenAI({ apiKey, baseURL });

const PROJ = path.resolve(process.cwd());
const outDir = path.join(PROJ, 'assets/bible/character_refs/iterations/2026-05-27-mama-gpt-prompt');
fs.mkdirSync(outDir, { recursive: true });

const prompt = `可爱的拟人化兔子，采用高级动画电影级CGI风格，拥有柔软的灰色兔毛，点缀着淡淡的白色，一双灵动的大紫色眼睛，竖起的耳朵，温暖灿烂的笑容，蓬松细腻的毛发，紧凑灵活的身形，身着浅黄色碎花夏日连衣裙，饰以精致的白色小花，活泼乐观的性格，全身角色设计，电影级柔和的光照，全局光照，柔和的轮廓光，鲜艳而自然的色彩，富有表现力的面部表情和迷人的轮廓，柔和的景深，优雅可爱，自然放松的姿态。`;

fs.writeFileSync(path.join(outDir, 'prompt.txt'), prompt);

const logPath = path.join(outDir, 'log.txt');
fs.writeFileSync(logPath, `=== zh-prompt run ${new Date().toISOString()} ===\nPrompt:\n${prompt}\n\n`);

const ATTEMPTS = 3;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

for (let i = 1; i <= ATTEMPTS; i++) {
  const ts = new Date().toISOString();
  process.stdout.write(`[attempt ${i}] ${ts}... `);
  try {
    const r = await client.images.generate({ model, prompt, size: '1024x1536', quality: 'high', n: 1 });
    const b64 = r.data?.[0]?.b64_json;
    if (b64) {
      const imgPath = path.join(outDir, `attempt-${i}.png`);
      fs.writeFileSync(imgPath, Buffer.from(b64, 'base64'));
      process.stdout.write(`SUCCESS → ${imgPath}\n`);
      fs.appendFileSync(logPath, `[${ts}] attempt=${i} SUCCESS → ${imgPath}\n`);
    } else {
      process.stdout.write('no-b64\n');
      fs.appendFileSync(logPath, `[${ts}] attempt=${i} no-b64\n`);
    }
  } catch (e) {
    const errMsg = e?.error?.param || e?.message || String(e);
    const codeMatch = errMsg.match(/"code":\s*"([^"]+)"/);
    const code = codeMatch ? codeMatch[1] : 'unknown';
    process.stdout.write(`FAIL(${code})\n`);
    fs.appendFileSync(logPath, `[${ts}] attempt=${i} FAIL code=${code}\n`);
  }
  await sleep(2000);
}

console.log(`\nAll attempts done. See ${outDir}/`);
