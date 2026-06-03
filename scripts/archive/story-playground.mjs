// Story #1: 公园游乐场的初夏早晨
// Triggered by user 2026-05-28 evening.
// Three activities woven together: 七彩迷宫球攀爬 → 轮胎大滑梯(三段渐进) → 浅水池捞金鱼.
// Education hook: 勇敢尝试新事物 + 一家三口的玩耍时光.
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:3000';
const BOOK_ID = 'playground-2026-05-28';
const TRIGGER = `初夏的早晨,天气凉快,爸爸妈妈带水水去公园里的游乐场玩。
水水跟爸爸一起玩了七彩迷宫球攀爬玩具,这个新玩具非常不错,水水很喜欢。
又玩了水水最喜欢的轮胎大长滑梯——爸爸先抱着水水坐在大轮胎上往下滑,好刺激;妈妈也陪水水坐了一次。
然后妈妈问水水要不要自己试试坐一次一条短一点的轮胎大滑梯,水水勇敢的尝试了一下,成功了!太好玩了。
最后跟爸爸穿着防水服,下到一个超大的浅水池子里捞金鱼。小金鱼游得超级快,水水跟爸爸追来追去,
一次抓到1条,有两次抓到2条,最后午饭时间到了,水水跟爸爸一起总共抓了8条鱼,
又把小鱼都倒回池子里,跟小金鱼说拜拜,回家吃饭咯~`;
const EDU = '勇敢尝试新事物——从被爸爸妈妈陪着玩,到自己独立尝试,享受成功的喜悦;一家三口在自然里玩耍的快乐时光';
const CHARS = ['shuishui', 'papa', 'mama'];

const PROJ = path.resolve(process.cwd());
const logPath = `/tmp/story-${BOOK_ID}.log`;
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logPath, line + '\n');
};

fs.writeFileSync(logPath, `=== ${BOOK_ID} run ${new Date().toISOString()} ===\nTrigger: ${TRIGGER}\nEdu: ${EDU}\nChars: ${CHARS.join(', ')}\n\n`);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function postJson(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = { _raw: text }; }
  return { ok: r.ok, status: r.status, body: parsed };
}

async function main() {
  log('=== STEP 1: generate-story ===');
  const storyRes = await postJson(`${BASE}/api/generate-story/`, {
    trigger: TRIGGER,
    education_goal: EDU,
    characters_in_book: CHARS,
  });
  if (!storyRes.ok) {
    log(`story FAIL status=${storyRes.status} body=${JSON.stringify(storyRes.body)}`);
    process.exit(1);
  }
  const story = storyRes.body.story;
  log(`story OK: title="${story.title}" subtitle="${story.subtitle}" pages=${story.pages.length}`);
  fs.writeFileSync(`/tmp/story-${BOOK_ID}-storyboard.json`, JSON.stringify(story, null, 2));
  log(`storyboard saved to /tmp/story-${BOOK_ID}-storyboard.json`);

  for (const p of story.pages) {
    log(`  page ${p.page} [${p.shot}, ${p.emotion}] in=${p.characters_in_scene.join(',')} narration="${p.narration.slice(0,50)}..."`);
  }

  log('\n=== STEP 2: generate images ===');
  const pageResults = [];
  for (const page of story.pages) {
    let success = null;
    let attempts = [];
    for (let i = 1; i <= 3; i++) {
      log(`page ${page.page} attempt ${i}...`);
      const r = await postJson(`${BASE}/api/generate-image/`, { page, book_id: BOOK_ID });
      attempts.push({ attempt: i, status: r.status, ok: r.ok, error: r.body?.error });
      if (r.ok && r.body?.image_path) {
        success = r.body.image_path;
        log(`  → SUCCESS ${success}`);
        break;
      }
      log(`  → FAIL status=${r.status} error="${r.body?.error || 'unknown'}"`);
      await sleep(3000);
    }
    pageResults.push({ page: page.page, image_path: success, attempts });
    page.image_path = success || undefined;
  }

  const failed = pageResults.filter(r => !r.image_path);
  log(`\nrender summary: ${pageResults.length - failed.length}/${pageResults.length} pages OK, ${failed.length} failed`);
  for (const f of failed) log(`  failed page ${f.page}: ${JSON.stringify(f.attempts)}`);

  log('\n=== STEP 3: save book ===');
  const book = {
    id: BOOK_ID,
    title: story.title,
    subtitle: story.subtitle,
    theme: story.theme,
    moral: story.moral,
    age_target: '3-4',
    pages: story.pages,
    created_at: new Date().toISOString(),
    status: failed.length === 0 ? 'finished' : 'rendering',
  };
  const saveRes = await postJson(`${BASE}/api/save-book/`, { book });
  if (saveRes.ok) {
    log(`book saved: ${saveRes.body.saved_to}`);
  } else {
    log(`save FAIL ${JSON.stringify(saveRes.body)}`);
  }

  log(`\n=== DONE ===\nView at: ${BASE}/books/${BOOK_ID}\nImages dir: public/generated/${BOOK_ID}/`);
}

main().catch(e => { log(`fatal: ${e.message}`); process.exit(1); });
