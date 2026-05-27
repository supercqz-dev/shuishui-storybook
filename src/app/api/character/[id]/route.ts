import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import YAML from 'yaml';
import type { CharacterBible } from '@/lib/bible';

export const dynamic = 'force-dynamic';

const CHARS_DIR = path.join(process.cwd(), 'assets', 'bible', 'characters');
const REFS_DIR = path.join(process.cwd(), 'assets', 'bible', 'character_refs');

function slug(s: string): string {
  return s.replace(/[^a-z0-9-]/gi, '-');
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const safeId = slug(id);
  if (safeId !== id) {
    return NextResponse.json({ error: 'id 含非法字符' }, { status: 400 });
  }
  try {
    const raw = await fs.readFile(path.join(CHARS_DIR, `${safeId}.yaml`), 'utf-8');
    const obj = YAML.parse(raw) as CharacterBible;
    return NextResponse.json({ character: obj, raw_yaml: raw });
  } catch {
    return NextResponse.json({ error: `角色 '${safeId}' 不存在` }, { status: 404 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const safeId = slug(id);
  if (safeId !== id) {
    return NextResponse.json({ error: 'id 含非法字符' }, { status: 400 });
  }
  if (safeId === 'shuishui') {
    return NextResponse.json({ error: '主角水水不可删除' }, { status: 400 });
  }
  const removed: string[] = [];
  try {
    await fs.unlink(path.join(CHARS_DIR, `${safeId}.yaml`));
    removed.push(`characters/${safeId}.yaml`);
  } catch (e) {
    if ((e as { code?: string }).code !== 'ENOENT') throw e;
  }
  try {
    await fs.unlink(path.join(REFS_DIR, `${safeId}.png`));
    removed.push(`character_refs/${safeId}.png`);
  } catch (e) {
    if ((e as { code?: string }).code !== 'ENOENT') throw e;
  }
  if (removed.length === 0) {
    return NextResponse.json({ error: `角色 '${safeId}' 不存在` }, { status: 404 });
  }
  return NextResponse.json({ deleted: removed });
}
