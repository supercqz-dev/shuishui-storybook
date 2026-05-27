'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Book } from '@/lib/types';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
const withBase = (p?: string) => (p?.startsWith('/') ? `${BASE_PATH}${p}` : p);

export default function BookCard({ book }: { book: Book }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'edit' | 'delete' | null>(null);
  const cover = book.cover_image ?? book.pages?.[0]?.image_path;

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`确认删除《${book.title}》？这会删 json + 8 张图,不可撤销。`)) return;
    setBusy('delete');
    try {
      const res = await fetch('/api/delete-book/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ book_id: book.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      router.refresh();
    } catch (err) {
      alert(`删除失败: ${err instanceof Error ? err.message : String(err)}`);
      setBusy(null);
    }
  }

  return (
    <div className="group">
      <Link
        href={`/books/${book.id}`}
        className="block aspect-[3/4] bg-shuishui-pink-soft rounded-xl shadow-sm hover:shadow-md transition overflow-hidden relative"
      >
        <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/40 via-transparent z-10 pointer-events-none">
          <h3 className="text-white font-semibold text-base leading-tight">
            {book.title}
          </h3>
          {book.subtitle && (
            <p className="text-white/80 text-xs mt-1">{book.subtitle}</p>
          )}
        </div>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={withBase(cover)}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            🐰
          </div>
        )}
      </Link>
      <div className="flex gap-2 mt-2">
        <Link
          href={`/editor?book_id=${book.id}`}
          className={`flex-1 text-center text-sm font-medium px-3 py-2 rounded-lg transition ${
            busy
              ? 'bg-gray-100 text-gray-400 pointer-events-none'
              : 'bg-shuishui-pink-soft text-shuishui-pink hover:bg-shuishui-pink hover:text-white'
          }`}
        >
          编辑
        </Link>
        <button
          onClick={handleDelete}
          disabled={busy !== null}
          className={`text-sm font-medium px-3 py-2 rounded-lg transition ${
            busy === 'delete'
              ? 'bg-red-100 text-red-300'
              : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600'
          }`}
        >
          {busy === 'delete' ? '删除中…' : '删除'}
        </button>
      </div>
    </div>
  );
}
