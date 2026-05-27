// Experiment: try Chinese-language prompts for shuishui / papa / laolao.
// Hypothesis (based on mama success on 2026-05-27): 中文 prompt 出图更自然、表情灵动。
// All outputs go to iterations/2026-05-27-zh-experiment/, NEVER touches canonical.
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL;
const model = process.env.IMAGE_MODEL;
if (!apiKey || !baseURL || !model) { console.error('missing env'); process.exit(1); }
const client = new OpenAI({ apiKey, baseURL });

const PROJ = path.resolve(process.cwd());
const outDir = path.join(PROJ, 'assets/bible/character_refs/iterations/2026-05-27-zh-experiment');
fs.mkdirSync(outDir, { recursive: true });

const ATTEMPTS = 3;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const characters = [
  {
    id: 'shuishui',
    prompt: `可爱的拟人化白色小兔子,3.5岁幼儿宝宝,采用高级动画电影级CGI风格,大头小身的幼态比例(头占身高约一半,头身比 1:2),纯白色蓬松柔软的绒毛,长长的兔耳朵竖立向上(比头还高),圆圆肉肉的婴儿脸庞和软软的婴儿肥脸颊,大大明亮的琥珀色眼睛(像婴儿一样略大),粉色的小鼻子,甜美温暖的微笑,身着粉色小裙子,粉色小运动鞋,头顶戴着粉色碎花发带(发带前侧别着一颗粉色爱心发卡,发卡在发带上不在耳朵上),活泼好奇的性格,姿态自然放松,全身角色设计,电影级柔和的光照,鲜艳而自然的色彩,富有表现力的面部表情,优雅可爱,自然乖巧.`
  },
  {
    id: 'papa',
    prompt: `可爱的拟人化红狐狸爸爸,40岁,采用高级动画电影级CGI风格,瘦高匀称挺拔的身材,温暖的红橙色毛发(腹部和脸下侧奶白色),三角形竖耳尖端深色,蓬松的大狐狸尾巴尖端白色,温暖的绿色眼睛,戴着细边棕色玳瑁色眼镜(细金属/醋酸纤维框),友好开朗的笑容,身着白色T恤+深绿色褶皱设计师外套+深蓝色褶皱长裤+深灰色翻毛皮运动鞋,左手腕戴着银珠子手链,设计师感利落质感的气质,姿态自然放松挺拔,全身角色设计,电影级柔和的光照,鲜艳而自然的色彩,富有表现力的面部表情,优雅可爱.`
  },
  {
    id: 'laolao',
    prompt: `可爱的拟人化绵羊姥姥,57岁,采用高级动画电影级CGI风格,微胖慈祥的小老太体型,头顶卷毛打理整齐(纯白色卷毛,雪白不偏黄,不松散凌乱),柔软的绵羊耳朵软软地垂在脸两侧,笑起来眯眯眼,慈祥但精气神十足,不戴任何眼镜(脸上没有眼镜),身着白色亚麻衬衫+浅棕色棉麻宽松裤+暖灰色穆勒鞋,时髦但不刻意的老太太气质,姿态自然放松慈祥,全身角色设计,电影级柔和的光照,鲜艳而自然的色彩,富有表现力的面部表情,优雅可爱.`
  }
];

const logPath = path.join(outDir, 'log.txt');
fs.writeFileSync(logPath, `=== zh-character experiment ${new Date().toISOString()} ===\n`);

// 串行跑(不并行,避免 Azure 偶发同步触发拦截)
for (const c of characters) {
  fs.writeFileSync(path.join(outDir, `${c.id}.prompt.txt`), c.prompt);
  for (let i = 1; i <= ATTEMPTS; i++) {
    const ts = new Date().toISOString();
    process.stdout.write(`[${c.id} #${i}] ${ts}... `);
    try {
      const r = await client.images.generate({
        model, prompt: c.prompt, size: '1024x1536', quality: 'high', n: 1
      });
      const b64 = r.data?.[0]?.b64_json;
      if (b64) {
        const out = path.join(outDir, `${c.id}-attempt-${i}.png`);
        fs.writeFileSync(out, Buffer.from(b64, 'base64'));
        process.stdout.write(`SUCCESS → ${out}\n`);
        fs.appendFileSync(logPath, `[${ts}] ${c.id} attempt=${i} SUCCESS → ${out}\n`);
        break; // 这个角色第一次过就停,继续下一个角色
      }
      process.stdout.write('no-b64\n');
    } catch (e) {
      const errMsg = e?.error?.param || e?.message || String(e);
      const codeMatch = errMsg.match(/"code":\s*"([^"]+)"/);
      const code = codeMatch ? codeMatch[1] : 'unknown';
      process.stdout.write(`FAIL(${code})\n`);
      fs.appendFileSync(logPath, `[${ts}] ${c.id} attempt=${i} FAIL code=${code}\n`);
    }
    await sleep(3000);
  }
}

console.log(`\nAll done. See ${outDir}/`);
