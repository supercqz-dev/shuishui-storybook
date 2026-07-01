import fs from 'fs';
import path from 'path';
import { execFileSync, spawnSync } from 'child_process';

const ROOT = process.cwd();
const BOOK_ID = process.env.BOOK_ID || process.env.BOOK;
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const SKIP_GIT = process.env.SKIP_GIT === '1' || process.env.SKIP_GIT === 'true';
const SKIP_PUSH = process.env.SKIP_PUSH === '1' || process.env.SKIP_PUSH === 'true';
const SKIP_ACTIONS = process.env.SKIP_ACTIONS === '1' || process.env.SKIP_ACTIONS === 'true';
const COMMIT_MESSAGE = process.env.COMMIT_MESSAGE || (BOOK_ID ? `Publish ${BOOK_ID}` : 'Publish storybook update');
const ACTION_TIMEOUT_MS = Number(process.env.ACTION_TIMEOUT_MS || 15 * 60 * 1000);
const ACTION_POLL_MS = Number(process.env.ACTION_POLL_MS || 15 * 1000);

if (!BOOK_ID) {
  console.error('missing BOOK_ID (or BOOK)');
  process.exit(1);
}

const bookPath = path.join(ROOT, 'data', 'books', `${BOOK_ID}.json`);
const generatedDir = path.join(ROOT, 'public', 'generated', BOOK_ID);

function log(message) {
  console.log(`[publish-book] ${message}`);
}

function run(command, args, options = {}) {
  const printable = [command, ...args].join(' ');
  if (DRY_RUN && options.mutate) {
    log(`DRY_RUN skip: ${printable}`);
    return '';
  }
  log(`$ ${printable}`);
  return execFileSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
}

function commandExists(command) {
  const result = spawnSync('sh', ['-lc', `command -v ${command}`], { encoding: 'utf8' });
  return result.status === 0;
}

function readBook() {
  if (!fs.existsSync(bookPath)) {
    throw new Error(`book JSON not found: ${path.relative(ROOT, bookPath)}`);
  }
  return JSON.parse(fs.readFileSync(bookPath, 'utf8'));
}

function listFilesRecursive(dir, predicate) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full, predicate));
    else if (!predicate || predicate(full)) out.push(full);
  }
  return out;
}

function toWebpPath(file) {
  return file.replace(/\.png$/i, '.webp');
}

function ensureWebpForPngs() {
  if (!fs.existsSync(generatedDir)) {
    throw new Error(`generated dir not found: ${path.relative(ROOT, generatedDir)}`);
  }
  const pngs = listFilesRecursive(generatedDir, (file) => file.toLowerCase().endsWith('.png'));
  if (pngs.length === 0) {
    log('no PNG files to convert');
    return;
  }
  if (!commandExists('cwebp')) {
    throw new Error('cwebp not found; install webp tools before publishing');
  }
  for (const png of pngs) {
    const webp = toWebpPath(png);
    run('cwebp', ['-quiet', '-q', '90', png, '-o', webp], { mutate: true });
  }
  for (const png of pngs) {
    if (!fs.existsSync(toWebpPath(png))) {
      throw new Error(`conversion failed: ${path.relative(ROOT, png)}`);
    }
  }
  for (const png of pngs) {
    if (DRY_RUN) log(`DRY_RUN skip delete: ${path.relative(ROOT, png)}`);
    else fs.unlinkSync(png);
  }
  log(`converted and removed ${pngs.length} PNG file(s)`);
}

function rewriteGeneratedPathsToWebp(book) {
  let changed = false;
  for (const page of book.pages || []) {
    if (page.image_path?.includes('/generated/') && page.image_path.endsWith('.png')) {
      page.image_path = page.image_path.replace(/\.png$/, '.webp');
      changed = true;
    }
  }
  if (book.cover_image?.includes('/generated/') && book.cover_image.endsWith('.png')) {
    book.cover_image = book.cover_image.replace(/\.png$/, '.webp');
    changed = true;
  }
  if (changed) {
    if (DRY_RUN) log(`DRY_RUN would rewrite generated paths to .webp in ${path.relative(ROOT, bookPath)}`);
    else fs.writeFileSync(bookPath, JSON.stringify(book, null, 2) + '\n');
  }
  return changed;
}

function validateBookFiles(book) {
  if (!Array.isArray(book.pages) || book.pages.length === 0) {
    throw new Error('book has no pages');
  }
  const badPage = book.pages.find((page, index) => page.page !== index + 1);
  if (badPage) {
    throw new Error(`page numbers must be continuous; found page=${badPage.page}`);
  }
  const missing = [];
  for (const page of book.pages) {
    if (!page.image_path) missing.push(`page ${page.page}: missing image_path`);
    else {
      const file = path.join(ROOT, 'public', page.image_path.replace(/^\//, ''));
      if (!fs.existsSync(file)) missing.push(page.image_path);
    }
  }
  if (book.cover_image) {
    const coverFile = path.join(ROOT, 'public', book.cover_image.replace(/^\//, ''));
    if (!fs.existsSync(coverFile)) missing.push(book.cover_image);
  }
  if (missing.length) {
    throw new Error(`missing generated files:\n${missing.join('\n')}`);
  }
  const pngs = listFilesRecursive(generatedDir, (file) => file.toLowerCase().endsWith('.png'));
  if (pngs.length) {
    throw new Error(`PNG files remain after conversion:\n${pngs.map((file) => path.relative(ROOT, file)).join('\n')}`);
  }
  log(`validated ${book.pages.length} page image(s), cover=${book.cover_image ? 'yes' : 'no'}, pngs=0`);
}

function gitChangedFiles() {
  const output = run('git', ['status', '--short'], { capture: true }).trim();
  return output ? output.split('\n') : [];
}

function ensureOnlyBookChanges() {
  const allowedPrefixes = [
    `data/books/${BOOK_ID}.json`,
    `public/generated/${BOOK_ID}/`,
  ];
  const changes = gitChangedFiles();
  const unexpected = changes.filter((line) => {
    const file = line.slice(3);
    return !allowedPrefixes.some((prefix) => file === prefix || file.startsWith(prefix));
  });
  if (unexpected.length) {
    throw new Error(`unexpected working tree changes; commit or stash them before publishing:\n${unexpected.join('\n')}`);
  }
  return changes;
}

function commitAndPush() {
  if (SKIP_GIT) {
    log('SKIP_GIT=1; skipping git add/commit/push');
    return null;
  }
  const changes = ensureOnlyBookChanges();
  if (changes.length === 0) {
    log('no git changes to commit');
    return null;
  }
  run('git', ['add', `data/books/${BOOK_ID}.json`, `public/generated/${BOOK_ID}`], { mutate: true });
  if (DRY_RUN) {
    log(`DRY_RUN skip commit: ${COMMIT_MESSAGE}`);
    return null;
  }
  run('git', ['commit', '-m', COMMIT_MESSAGE], { mutate: true });
  const sha = run('git', ['rev-parse', 'HEAD'], { capture: true }).trim();
  if (SKIP_PUSH) {
    log(`SKIP_PUSH=1; committed ${sha} but did not push`);
    return sha;
  }
  run('git', ['push'], { mutate: true });
  return sha;
}

function waitForActions(sha) {
  if (!sha || SKIP_PUSH || SKIP_ACTIONS) return;
  if (!commandExists('gh')) {
    log('gh not found; skipping Actions check');
    return;
  }
  const deadline = Date.now() + ACTION_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const output = run('gh', [
      'run', 'list',
      '--commit', sha,
      '--limit', '1',
      '--json', 'status,conclusion,url,workflowName,displayTitle',
    ], { capture: true });
    const runs = JSON.parse(output || '[]');
    const runInfo = runs[0];
    if (!runInfo) {
      log('waiting for GitHub Actions run to appear...');
    } else {
      log(`Actions: ${runInfo.workflowName} status=${runInfo.status} conclusion=${runInfo.conclusion || 'pending'}`);
      if (runInfo.status === 'completed') {
        if (runInfo.conclusion !== 'success') {
          throw new Error(`GitHub Actions failed: ${runInfo.url}`);
        }
        log(`GitHub Pages deploy succeeded: ${runInfo.url}`);
        return;
      }
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ACTION_POLL_MS);
  }
  throw new Error(`timed out waiting for GitHub Actions for ${sha}`);
}

function main() {
  log(`publishing ${BOOK_ID}${DRY_RUN ? ' (dry run)' : ''}`);
  let book = readBook();
  ensureWebpForPngs();
  rewriteGeneratedPathsToWebp(book);
  book = readBook();
  validateBookFiles(book);
  const sha = commitAndPush();
  waitForActions(sha);
  log('done');
}

try {
  main();
} catch (error) {
  console.error(`[publish-book] ERROR: ${error.message}`);
  process.exit(1);
}
