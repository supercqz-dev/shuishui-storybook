import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const REFS_DIR = path.join(process.cwd(), 'assets', 'bible', 'character_refs');

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const safeId = id.replace(/[^a-z0-9-]/gi, '-');
  if (safeId !== id) {
    return NextResponse.json({ error: 'id 含非法字符' }, { status: 400 });
  }
  try {
    const buf = await fs.readFile(path.join(REFS_DIR, `${safeId}.png`));
    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    return NextResponse.json({ error: `ref '${safeId}' 不存在` }, { status: 404 });
  }
}
