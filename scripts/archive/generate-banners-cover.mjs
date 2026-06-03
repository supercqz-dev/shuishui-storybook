// One-off: generate library banners (zh + en) + veggie book cover.
// Saves to assets/branding/iterations/<date>/ to follow CONVENTIONS.md (no overwriting).
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
const outDir = path.join(PROJ, 'assets/branding/iterations', date);
fs.mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const tasks = [
  {
    name: 'banner-zh',
    size: '1536x1024',
    prompt: `一张温馨童书风格的横幅 banner 图。画面中央用清晰、可爱、童趣的中文字体写"水水的图书馆"五个大字。背景是柔和的粉色和奶油色渐变,带几本散落的童书插画装饰、几片飘落的小花瓣。风格是 Disney-Pixar 3D 渲染童书插画风,温暖光照,饱和但和谐。字体清晰易读,字间距合理。重要:文字必须是规范、可识别的简体中文"水水的图书馆"。`
  },
  {
    name: 'banner-en',
    size: '1536x1024',
    prompt: `A warm children's storybook style banner. The center features clean, cute, playful English text "ShuiShui's Library" in a friendly rounded font. Soft pink and cream gradient background, a few scattered children's books and small floating petals as decoration. Disney-Pixar 3D rendered storybook illustration style, warm cinematic lighting, vibrant but harmonious palette. The text must be clear, well-spaced, and properly spelled "ShuiShui's Library".`
  },
  {
    name: 'cover-veggies',
    size: '1024x1536',
    prompt: `儿童绘本封面,温馨晚餐场景。画面是一只可爱的拟人化白色小兔子(粉色小裙子+粉色花发带+爱心发卡)和一只拟人化灰色长耳兔子妈妈(黄色碎花连衣裙)在家里餐桌前,桌上有一碗青菜和一盘红烧肉,妈妈温柔地看着小兔子。画面顶部留白用清晰的可爱中文字体写大字"水水的三口青菜",字体下方小一号字"周末晚饭的小小约定"。风格是 Disney-Pixar 3D 渲染童书插画,暖色调温馨灯光,文字清晰易读规范的简体中文。`
  }
];

for (const t of tasks) {
  const ts = new Date().toISOString();
  process.stdout.write(`[${t.name}] ${ts} size=${t.size}... `);
  try {
    const r = await client.images.generate({
      model, prompt: t.prompt, size: t.size, quality: 'high', n: 1
    });
    const b64 = r.data?.[0]?.b64_json;
    if (b64) {
      const out = path.join(outDir, `${t.name}.png`);
      fs.writeFileSync(out, Buffer.from(b64, 'base64'));
      fs.writeFileSync(out + '.prompt.txt', t.prompt);
      process.stdout.write(`SUCCESS → ${out}\n`);
    } else {
      process.stdout.write('no-b64\n');
    }
  } catch (e) {
    const errMsg = e?.error?.param || e?.message || String(e);
    const codeMatch = errMsg.match(/"code":\s*"([^"]+)"/);
    const code = codeMatch ? codeMatch[1] : 'unknown';
    process.stdout.write(`FAIL(${code})\n`);
    fs.appendFileSync(path.join(outDir, 'errors.log'), `[${ts}] ${t.name} FAIL: ${errMsg}\n`);
  }
  await sleep(3000);
}

console.log(`\nDone. See ${outDir}/`);
