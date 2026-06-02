// Unified book runner with smart retry/fallback for Azure moderation issues.
// Usage: BOOK=playground node scripts/book-runner.mjs
//        BOOK=ants node scripts/book-runner.mjs
//        BOOK=claycat node scripts/book-runner.mjs
//        BOOK=all node scripts/book-runner.mjs
import fs from 'fs';
import path from 'path';
import { Agent, setGlobalDispatcher } from 'undici';

// Azure image generation can take 90+ seconds; default undici headers timeout (5min) is fine
// but we extend body timeout in case of slow streaming, and disable headers timeout entirely.
setGlobalDispatcher(new Agent({
  headersTimeout: 600_000,  // 10 min
  bodyTimeout: 600_000,
  connectTimeout: 30_000,
}));

const BASE = 'http://localhost:3000';

const BOOKS = {
  childrensday: {
    book_id: 'childrensday-toystore-2026-06-01',
    chars: ['shuishui', 'mama', 'laolao'],
    trigger: `六一儿童节这天,水水有点小感冒、身体不太舒服,所以没去学校参加节日活动。
不过水水很勇敢,已经能自己乖乖喝下小药水了,真棒!
为了让水水开心,妈妈和姥姥带她去大融城商场逛街、买她喜欢的玩具。
玩具店里玩具好多好多!水水先走过毛绒玩具区——可是她已经有好多好多毛绒玩具啦,
看了半天,emm,好像都没有特别想要的,那今天就不选毛绒玩具啦。
最后水水自己挑了三样:一个小兔子钥匙扣、一盒粉色的水晶泥、还有一个可爱的粉色双层小推车玩具。真丰富!
选好玩具,妈妈和姥姥又带水水去吃她最爱的炸鸡翅和小汉堡,香香的,水水吃得好开心。
虽然今年没在学校过儿童节,但有妈妈和姥姥一直陪着,这个儿童节又特别又开心!

构图提示:
- 这是水水+妈妈+姥姥的温馨故事,逛街/吃饭等场景三个一起出现没问题,该同框就同框;某段只跟一位互动就画那两个。
- 开头"水水有点不舒服"只需画水水在家窝在沙发上、表情蔫蔫但勇敢的样子即可,不要画药片/针剂/体温计等医疗道具,氛围温柔。
- 重点和篇幅放在后面:热闹的玩具店、挑选三样玩具(小兔子钥匙扣 / 粉色水晶泥盒 / 粉色双层小推车玩具)、开心吃炸鸡翅和小汉堡。
- 角色:水水(白兔)、妈妈(白兔,黄花裙)、姥姥(绵羊,白卷毛+亚麻衫)。`,
    edu: '勇敢面对小病痛(自己乖乖喝药)+ 感受家人的陪伴——即使计划被打乱,有爱的人陪着,平凡的一天也能很特别、很快乐。',
  },
  playground: {
    book_id: 'playground-2026-05-28',
    chars: ['shuishui', 'papa', 'mama'],
    trigger: `初夏的早晨,天气凉快,爸爸妈妈带水水去公园里的游乐场玩。
水水跟爸爸一起玩了七彩迷宫球攀爬玩具,这个新玩具非常不错,水水很喜欢。
又玩了水水最喜欢的轮胎大长滑梯——爸爸先抱着水水坐在大轮胎上往下滑,好刺激;妈妈也陪水水坐了一次。
然后妈妈问水水要不要自己试试坐一次一条短一点的轮胎大滑梯,水水勇敢的尝试了一下,成功了!太好玩了。
最后跟爸爸穿着防水服,下到一个超大的浅水池子里捞金鱼。小金鱼游得超级快,水水跟爸爸追来追去,
一次抓到1条,有两次抓到2条,最后午饭时间到了,水水跟爸爸一起总共抓了8条鱼,
又把小鱼都倒回池子里,跟小金鱼说拜拜,回家吃饭咯~

构图提示:这是一家人的故事,该同框就同框。开场"一家人去公园"、结尾"一起回家"等温馨场景,
就把 shuishui+papa+mama 三个都画进画面;某段只有水水跟一位家长互动时,就画那两个。按剧情自然安排。`,
    edu: '勇敢尝试新事物——从被爸爸妈妈陪着玩,到自己独立尝试,享受成功的喜悦;一家三口在自然里玩耍的快乐时光',
  },
  // 验证用:与 playground 相同剧本,但用新的小熊猫 papa 重跑(独立 book_id,不覆盖旧狐狸版)
  playground_redpanda: {
    book_id: 'playground-redpanda-2026-05-29',
    chars: ['shuishui', 'papa', 'mama'],
    trigger: `初夏的早晨,天气凉快,爸爸妈妈带水水去公园里的游乐场玩。
水水跟爸爸一起玩了七彩迷宫球攀爬玩具,这个新玩具非常不错,水水很喜欢。
又玩了水水最喜欢的轮胎大长滑梯——爸爸先抱着水水坐在大轮胎上往下滑,好刺激;妈妈也陪水水坐了一次。
然后妈妈问水水要不要自己试试坐一次一条短一点的轮胎大滑梯,水水勇敢的尝试了一下,成功了!太好玩了。
最后跟爸爸穿着防水服,下到一个超大的浅水池子里捞金鱼。小金鱼游得超级快,水水跟爸爸追来追去,
一次抓到1条,有两次抓到2条,最后午饭时间到了,水水跟爸爸一起总共抓了8条鱼,
又把小鱼都倒回池子里,跟小金鱼说拜拜,回家吃饭咯~

构图提示:这是一家人的故事,该同框就同框。开场"一家人去公园"、结尾"一起回家"等温馨场景,
就把 shuishui+papa+mama 三个都画进画面;某段只有水水跟一位家长互动时,就画那两个。按剧情自然安排。`,
    edu: '勇敢尝试新事物——从被爸爸妈妈陪着玩,到自己独立尝试,享受成功的喜悦;一家三口在自然里玩耍的快乐时光',
  },
  ants: {
    book_id: 'ants-2026-05-28',
    chars: ['shuishui', 'papa'],
    trigger: `水水跟爸爸在公园游乐场玩了一会儿滑梯,有点累了,坐到长椅上休息。
水水低头看见长椅旁边一群小蚂蚁,排成一队队,有的搬着比自己还大的面包渣,有的扛着小树叶。
水水好奇地蹲下来观察,爸爸耐心地给水水讲蚂蚁的小知识——
蚂蚁虽然小小的,但是力气很大,能搬动比自己重好几倍的东西;
而且蚂蚁特别会分工协作,有的找路,有的搬运,有的守卫,大家一起完成任务;
蚂蚁是非常勤劳的小昆虫,不管太阳多晒,都不停地忙碌。
水水看得入了神,小心翼翼地不打扰小蚂蚁,还说以后要像蚂蚁一样勤劳。
休息够了,水水跟爸爸继续去玩。

构图提示:每页只有水水+爸爸两人,加上特写的小蚂蚁。`,
    edu: '认识蚂蚁——力气大、分工合作、勤劳;同时鼓励水水保持好奇心、用观察的方式了解小动物',
  },
  claycat: {
    book_id: 'claycat-2026-05-28',
    chars: ['shuishui', 'papa'],
    trigger: `今天是水水幼儿园的夏日亲子活动日,爸爸下了班就到学校了。
学校里非常热闹,好多小朋友和他们的爸爸妈妈(画面里把其他家长和小朋友都画成不同种类的小动物——比如熊、小猪、小象、小猴等)。
水水今天带着她最喜欢的小橘猫玩具——圆圆胖胖的身体,脖子上挂着一个小圆牌。
今天爸爸要和水水一起用陶泥捏一只跟玩具一样的小橘猫,因为爸爸是家里最会画画和捏陶泥的!
幼儿园准备了好多种不同颜色的陶泥,爸爸和水水选了橘色的。
他们一起合作:爸爸搓圆圆的身子,水水搓圆圆的脑袋,捏了一对小猫耳朵;
还捏了一块白色的贴在小猫肚子上,接上小手小脚,捏了蓝色的猫眼睛。
最后水水还捏了一个小吊牌贴在小橘猫脖子上——可太像了!
水水开心地拿着捏好的小橘猫,先去给王老师(熊猫)看,又给张老师(长颈鹿)看,最后给刘老师(小浣熊)看。
老师们都夸捏得特别好。
活动结束了,爸爸牵着水水的小手(水水另一只手举着小橘猫陶泥),开心地一起回家咯。

构图提示:大部分页面只画水水+爸爸 + 桌上的橘色陶泥;给老师看的几页可以分开画(每页只画水水+一位老师),不要全班合影式的画面。`,
    edu: '亲子合作——爸爸的创造力陪伴 + 水水自己动手参与;同时通过把同学们画成各种小动物,温柔表达"我们身边的人都不一样"',
  },
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function postJson(url, body) {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { _raw: text }; }
    return { ok: r.ok, status: r.status, body: parsed };
  } catch (e) {
    return { ok: false, status: 0, body: { error: `fetch_error: ${e.message}` } };
  }
}

function classifyError(body) {
  const blob = JSON.stringify(body);
  if (blob.includes('moderation_blocked')) return 'moderation';
  if (blob.includes('EngineOverloaded')) return 'overload';
  if (blob.includes('Connection timed out') || blob.includes('Connection reset') || blob.includes('fetch_error') || blob.includes('Headers Timeout') || blob.includes('UND_ERR')) return 'network';
  if (blob.includes('rate limit') || blob.includes('429')) return 'rate';
  return 'other';
}

function existingImagePath(book_id, pageNum) {
  const filename = `page-${String(pageNum).padStart(2, '0')}.png`;
  const p = path.join(process.cwd(), 'public', 'generated', book_id, filename);
  if (fs.existsSync(p) && fs.statSync(p).size > 1000) {
    return `/generated/${book_id}/${filename}`;
  }
  return null;
}

async function generateImageWithRetry(page, book_id, log) {
  // Strategy:
  // - For each prompt variant, try up to 3 times for transient errors (overload/network)
  // - On moderation_blocked, immediately move to next variant (deterministic — same prompt won't unblock)
  // - Variants progressively reduce moderation surface area
  const variants = [
    { name: 'original', mutate: (p) => p },
    {
      name: 'drop-mama-keep-papa',
      mutate: (p) => p.characters_in_scene.length >= 3 && p.characters_in_scene.includes('papa')
        ? { ...p, characters_in_scene: p.characters_in_scene.filter((c) => c !== 'mama') }
        : null,
    },
    {
      name: 'drop-papa-keep-mama',
      mutate: (p) => p.characters_in_scene.length >= 3 && p.characters_in_scene.includes('mama')
        ? { ...p, characters_in_scene: p.characters_in_scene.filter((c) => c !== 'papa') }
        : null,
    },
    {
      name: 'medium-shot',
      mutate: (p) => p.shot === 'wide' ? { ...p, shot: 'medium' } : null,
    },
    {
      name: 'shuishui-only',
      mutate: (p) => p.characters_in_scene.length > 1
        ? { ...p, characters_in_scene: ['shuishui'] }
        : null,
    },
  ];

  const attempts = [];
  for (let v = 0; v < variants.length; v++) {
    const variant = variants[v];
    const mutated = variant.mutate(page);
    if (mutated === null) {
      log(`    page ${page.page} skip variant=${variant.name} (no-op)`);
      continue;
    }
    let moderationOnThisVariant = false;
    for (let r = 1; r <= 3 && !moderationOnThisVariant; r++) {
      log(`    page ${page.page} variant=${variant.name} retry=${r} chars=[${mutated.characters_in_scene.join(',')}] shot=${mutated.shot}`);
      const resp = await postJson(`${BASE}/api/generate-image/`, { page: mutated, book_id });
      if (resp.ok && resp.body?.image_path) {
        log(`    → SUCCESS via ${variant.name}: ${resp.body.image_path}`);
        return { image_path: resp.body.image_path, used_variant: variant.name, attempts };
      }
      const klass = classifyError(resp.body);
      attempts.push({ variant: variant.name, retry: r, status: resp.status, klass });
      log(`    → FAIL ${klass} status=${resp.status}`);
      if (klass === 'moderation') {
        moderationOnThisVariant = true; // skip remaining retries on this variant
        break;
      }
      const wait = klass === 'overload' ? 12000 : klass === 'network' ? 6000 : 4000;
      await sleep(wait);
    }
    if (moderationOnThisVariant) await sleep(2000); // small pause before next variant
  }
  return { image_path: null, attempts };
}

async function runBook(spec) {
  const { book_id, chars, trigger, edu } = spec;
  const logPath = `/tmp/story-${book_id}.log`;
  const log = (msg) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    fs.appendFileSync(logPath, line + '\n');
  };
  fs.writeFileSync(logPath, `=== ${book_id} run ${new Date().toISOString()} ===\nChars: ${chars.join(', ')}\n\n`);

  const storyboardPath = `/tmp/story-${book_id}-storyboard.json`;
  let story;
  if (fs.existsSync(storyboardPath)) {
    log(`=== ${book_id}: STEP 1 reuse cached storyboard (${storyboardPath}) ===`);
    story = JSON.parse(fs.readFileSync(storyboardPath, 'utf-8'));
    log(`story REUSED: title="${story.title}" pages=${story.pages.length}`);
  } else {
    log(`=== ${book_id}: STEP 1 generate-story ===`);
    const storyRes = await postJson(`${BASE}/api/generate-story/`, {
      trigger, education_goal: edu, characters_in_book: chars,
    });
    if (!storyRes.ok) {
      log(`story FAIL status=${storyRes.status} body=${JSON.stringify(storyRes.body).slice(0, 500)}`);
      return { ok: false, reason: 'story-gen-failed' };
    }
    story = storyRes.body.story;
    log(`story OK: title="${story.title}" pages=${story.pages.length}`);
    fs.writeFileSync(storyboardPath, JSON.stringify(story, null, 2));
  }

  for (const p of story.pages) {
    log(`  p${p.page} [${p.shot}/${p.emotion}] in=${p.characters_in_scene.join(',')} → "${p.narration.slice(0,40)}..."`);
  }

  log(`=== ${book_id}: STEP 2 generate images (${story.pages.length} pages) ===`);
  const pageResults = [];
  for (const page of story.pages) {
    const existing = existingImagePath(book_id, page.page);
    if (existing) {
      log(`  --- page ${page.page} SKIP (already exists: ${existing}) ---`);
      pageResults.push({ page: page.page, image_path: existing, used_variant: 'existing', attempts: [] });
      page.image_path = existing;
      continue;
    }
    log(`  --- page ${page.page} ---`);
    const r = await generateImageWithRetry(page, book_id, log);
    pageResults.push({ page: page.page, ...r });
    page.image_path = r.image_path || undefined;
    await sleep(2000); // pacing between pages
  }
  const failed = pageResults.filter((r) => !r.image_path);
  log(`render: ${pageResults.length - failed.length}/${pageResults.length} OK, ${failed.length} failed`);

  log(`=== ${book_id}: STEP 3 save-book ===`);
  const book = {
    id: book_id, title: story.title, subtitle: story.subtitle,
    theme: story.theme, moral: story.moral, age_target: '3-4',
    pages: story.pages, created_at: new Date().toISOString(),
    status: failed.length === 0 ? 'finished' : 'rendering',
  };
  const saveRes = await postJson(`${BASE}/api/save-book/`, { book });
  if (saveRes.ok) log(`book saved: ${saveRes.body.saved_to}`);
  else log(`save FAIL ${JSON.stringify(saveRes.body)}`);

  return {
    ok: failed.length === 0,
    book_id,
    pages_total: pageResults.length,
    pages_ok: pageResults.length - failed.length,
    failed,
  };
}

async function main() {
  const which = process.env.BOOK || 'playground';
  const targets = which === 'all' ? Object.keys(BOOKS) : [which];
  const summary = [];
  for (const k of targets) {
    if (!BOOKS[k]) {
      console.error(`unknown book "${k}", choices: ${Object.keys(BOOKS).join(', ')}`);
      process.exit(1);
    }
    console.log(`\n========== Running book: ${k} ==========\n`);
    const r = await runBook(BOOKS[k]);
    summary.push({ key: k, ...r });
  }
  console.log('\n========== ALL DONE ==========');
  for (const s of summary) {
    console.log(`  ${s.key}: ok=${s.ok} ${s.pages_ok}/${s.pages_total} pages`);
  }
}

main().catch((e) => { console.error('fatal:', e); process.exit(1); });
