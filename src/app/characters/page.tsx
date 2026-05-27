import Link from 'next/link';
import { promises as fs } from 'fs';
import path from 'path';
import { loadCharacters } from '@/lib/bible';
import CharacterCard from '@/components/CharacterCard';

export const dynamic = 'force-dynamic';

const REFS_DIR = path.join(process.cwd(), 'assets', 'bible', 'character_refs');

async function listRefs(): Promise<Map<string, number>> {
  try {
    const files = await fs.readdir(REFS_DIR);
    const out = new Map<string, number>();
    for (const f of files) {
      if (!f.endsWith('.png')) continue;
      const stat = await fs.stat(path.join(REFS_DIR, f));
      out.set(f.replace('.png', ''), stat.mtimeMs);
    }
    return out;
  } catch {
    return new Map();
  }
}

export default async function CharactersPage() {
  const [characters, refMap] = await Promise.all([loadCharacters(), listRefs()]);
  const sorted = [...characters].sort((a, b) => {
    const order = ['shuishui', 'papa', 'mama', 'laolao'];
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.id.localeCompare(b.id);
  });

  return (
    <main className="tool-app min-h-screen bg-tool-bg text-tool-ink">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Link href="/" className="text-sm text-tool-ink-soft hover:text-tool-ink">
              ← 返回书架
            </Link>
            <h1 className="text-3xl font-bold mt-2">角色管理</h1>
            <p className="text-sm text-tool-ink-soft mt-1">
              管理出场角色的设定和定妆图。改 prompt anchor 影响所有未来生成的画面。
            </p>
          </div>
          <Link
            href="/characters/new"
            className="bg-tool-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition"
          >
            ＋ 新增角色
          </Link>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((c) => {
            const mtime = refMap.get(c.id);
            return (
              <li key={c.id}>
                <CharacterCard
                  id={c.id}
                  name_cn={c.name_cn}
                  role={String(c.role || '')}
                  animal={String(c.animal || '')}
                  hasRef={refMap.has(c.id)}
                  refMtime={mtime}
                  isProtagonist={c.id === 'shuishui'}
                />
              </li>
            );
          })}
        </ul>

        <div className="mt-8 text-xs text-tool-ink-soft">
          💡 提示:重生定妆图大概 3 分钟。每次重生不会覆盖旧图,实际写入 canonical 之前可以去 iterations/ 比较新旧版。
        </div>
      </div>
    </main>
  );
}
