import { NextResponse } from 'next/server';
import { getBook } from '@/lib/books';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'id 必填' }, { status: 400 });
  }
  const book = await getBook(id);
  if (!book) {
    return NextResponse.json(
      { error: `book '${id}' 不存在` },
      { status: 404 },
    );
  }
  return NextResponse.json({ book });
}
