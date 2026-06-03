// End-to-end demo: trigger → 8-page story → 8 images.
// Saves all to public/generated/{book_id}/ and data/books/{book_id}.json.
// Retries each page up to 3 times on moderation_blocked.
// Logs everything to /tmp/demo-story-{book_id}.log.
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:3000';
const BOOK_ID = 'demo-2026-05-27-veggies';
const TRIGGER = '周末晚饭水水想多吃肉,不愿意吃蔬菜,妈妈温柔但坚持要她先吃几口蔬菜再吃肉';
const EDU = '学会均衡饮食,理解妈妈不是惩罚而是为她好';
const CHARS = ['shuishui', 'mama'];

const PROJ = path.resolve(process.cwd());
const logPath = `/tmp/demo-story-${BOOK_ID}.log`;
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logPath, line + '\n');
};

fs.writeFileSync(logPath, `=== demo run ${new Date().toISOString()} ===\nBook: ${BOOK_ID}\nTrigger: ${TRIGGER}\nEdu: ${EDU}\nChars: ${CHARS.join(', ')}\n\n`);

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
  // ━━━ 1. Generate story ━━━
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
  fs.writeFileSync(`/tmp/demo-story-${BOOK_ID}-storyboard.json`, JSON.stringify(story, null, 2));
  log(`storyboard saved to /tmp/demo-story-${BOOK_ID}-storyboard.json`);

  // Print page summaries
  for (const p of story.pages) {
    log(`  page ${p.page} [${p.shot}, ${p.emotion}] in=${p.characters_in_scene.join(',')} narration="${p.narration.slice(0,40)}..."`);
  }

  // ━━━ 2. Render each page (retry on moderation) ━━━
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

  // ━━━ 3. Save book ━━━
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
