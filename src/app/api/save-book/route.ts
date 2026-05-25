import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Book } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Body = {
  book: Book;
};

const BOOKS_DIR = path.join(process.cwd(), 'data', 'books');

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body.book?.id) {
      return NextResponse.json({ error: 'book.id 必填' }, { status: 400 });
    }
    const safeId = body.book.id.replace(/[^a-z0-9-]/gi, '-');
    if (safeId !== body.book.id) {
      return NextResponse.json(
        { error: 'book.id 只能用 a-z 0-9 - 字符' },
        { status: 400 },
      );
    }

    await fs.mkdir(BOOKS_DIR, { recursive: true });
    const outPath = path.join(BOOKS_DIR, `${safeId}.json`);
    await fs.writeFile(outPath, JSON.stringify(body.book, null, 2));
    return NextResponse.json({
      saved_to: `data/books/${safeId}.json`,
      id: safeId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[save-book] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
