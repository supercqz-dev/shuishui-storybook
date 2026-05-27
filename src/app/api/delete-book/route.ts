import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

type Body = { book_id: string };

const BOOKS_DIR = path.join(process.cwd(), 'data', 'books');
const IMG_DIR = path.join(process.cwd(), 'public', 'generated');

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body.book_id) {
      return NextResponse.json({ error: 'book_id 必填' }, { status: 400 });
    }
    const safeId = body.book_id.replace(/[^a-z0-9-]/gi, '-');
    if (safeId !== body.book_id) {
      return NextResponse.json(
        { error: 'book_id 含非法字符' },
        { status: 400 },
      );
    }

    const jsonPath = path.join(BOOKS_DIR, `${safeId}.json`);
    const imgPath = path.join(IMG_DIR, safeId);

    const removed: string[] = [];
    try {
      await fs.unlink(jsonPath);
      removed.push(`data/books/${safeId}.json`);
    } catch (e) {
      if ((e as { code?: string }).code !== 'ENOENT') throw e;
    }
    try {
      await fs.rm(imgPath, { recursive: true, force: true });
      removed.push(`public/generated/${safeId}/`);
    } catch (e) {
      if ((e as { code?: string }).code !== 'ENOENT') throw e;
    }

    if (removed.length === 0) {
      return NextResponse.json(
        { error: `book '${safeId}' 不存在` },
        { status: 404 },
      );
    }

    return NextResponse.json({ deleted: removed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[delete-book] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
