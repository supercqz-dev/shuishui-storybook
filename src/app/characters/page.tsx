import Link from 'next/link';
import { promises as fs } from 'fs';
import path from 'path';
import { loadCharacters } from '@/lib/bible';
import CharacterCard from '@/components/CharacterCard';

export const dynamic = 'force-dynamic';

const REFS_DIR = path.join(process.cwd(), 'assets', 'bible', 'character_refs');

async function listRefs(): Promise<Set<string>> {
  try {
    const files = await fs.readdir(REFS_DIR);
    return new Set(
      files.filter((f) => f.endsWith('.png')).map((f) => f.replace('.png', '')),
    );
  } catch {
    return new Set();
  }
}

export default async function CharactersPage() {
  const [characters, refIds] = await Promise.all([loadCharacters(), listRefs()]);
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
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <Link href="/" className="text-sm text-gray-500">← 返回书架</Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">角色管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理出场角色的设定。改 prompt anchor 可以改变图像生成时角色的样子。
          </p>
        </div>
        <Link
          href="/characters/new"
          className="bg-shuishui-pink text-white text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition"
        >
          ＋ 新增角色
        </Link>
      </header>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sorted.map((c) => (
          <li key={c.id}>
            <CharacterCard
              id={c.id}
              name_cn={c.name_cn}
              role={String(c.role || '')}
              animal={String(c.animal || '')}
              hasRef={refIds.has(c.id)}
              isProtagonist={c.id === 'shuishui'}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
