import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import YAML from 'yaml';

export const dynamic = 'force-dynamic';

const CHARS_DIR = path.join(process.cwd(), 'assets', 'bible', 'characters');

type Body = {
  id: string;
  name_cn: string;
  name_en?: string;
  role?: string;
  animal?: string;
  prompt_anchor: string;
  // 透传其他可选字段(personality, favorites 等)
  [k: string]: unknown;
};

function slug(s: string): string {
  return s.replace(/[^a-z0-9-]/gi, '-');
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body.id?.trim()) {
      return NextResponse.json({ error: 'id 必填' }, { status: 400 });
    }
    if (!body.name_cn?.trim()) {
      return NextResponse.json({ error: 'name_cn 必填' }, { status: 400 });
    }
    if (!body.prompt_anchor?.trim()) {
      return NextResponse.json({ error: 'prompt_anchor 必填' }, { status: 400 });
    }
    const safeId = slug(body.id);
    if (safeId !== body.id) {
      return NextResponse.json(
        { error: 'id 只能用小写字母/数字/-' },
        { status: 400 },
      );
    }

    await fs.mkdir(CHARS_DIR, { recursive: true });
    const outPath = path.join(CHARS_DIR, `${safeId}.yaml`);

    // Reorder fields so the yaml looks consistent with existing files
    const ordered: Record<string, unknown> = {
      id: safeId,
      name_cn: body.name_cn,
      ...(body.name_en && { name_en: body.name_en }),
      ...(body.role && { role: body.role }),
      ...(body.animal && { animal: body.animal }),
    };
    // Spread any extra fields provided by user (so existing 4 chars retain their full schema)
    for (const [k, v] of Object.entries(body)) {
      if (k === 'id' || k === 'name_cn' || k === 'name_en' || k === 'role' || k === 'animal' || k === 'prompt_anchor') continue;
      ordered[k] = v;
    }
    ordered.prompt_anchor = body.prompt_anchor;

    const yamlText = YAML.stringify(ordered);
    await fs.writeFile(outPath, yamlText);
    return NextResponse.json({
      saved_to: `assets/bible/characters/${safeId}.yaml`,
      id: safeId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[character POST] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
