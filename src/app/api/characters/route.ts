import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { loadCharacters } from '@/lib/bible';

export const dynamic = 'force-dynamic';

const REF_DIR = path.join(process.cwd(), 'assets', 'bible', 'character_refs');

export async function GET() {
  try {
    const characters = await loadCharacters();
    const annotated = await Promise.all(
      characters.map(async (c) => {
        let has_ref = false;
        try {
          await fs.access(path.join(REF_DIR, `${c.id}.png`));
          has_ref = true;
        } catch {}
        return {
          id: c.id,
          name_cn: c.name_cn,
          animal: c.animal,
          role: c.role,
          has_ref,
        };
      }),
    );
    return NextResponse.json({ characters: annotated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
