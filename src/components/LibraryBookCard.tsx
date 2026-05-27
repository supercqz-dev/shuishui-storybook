'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Book } from '@/lib/types';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
const withBase = (p?: string) => (p?.startsWith('/') ? `${BASE_PATH}${p}` : p);

export default function LibraryBookCard({
  book,
  manageMode,
}: {
  book: Book;
  manageMode: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<'delete' | null>(null);
  const cover = book.cover_image ?? book.pages?.[0]?.image_path;

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`确认删除《${book.title}》?`)) return;
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
    <div className="group relative">
      <Link
        href={`/books/${book.id}`}
        className="block aspect-[3/4] rounded-3xl overflow-hidden relative bg-cream-100 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 active:scale-[0.98] transition-all duration-300"
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={withBase(cover)}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">
            🐰
          </div>
        )}
        {/* 标题渐变蒙版 */}
        <div className="absolute inset-0 flex flex-col justify-end pointer-events-none">
          <div className="bg-gradient-to-t from-shuishui-brown/85 via-shuishui-brown/30 to-transparent pt-12 pb-4 px-4">
            <h3 className="text-white font-bold text-base sm:text-lg leading-tight drop-shadow">
              {book.title}
            </h3>
            {book.subtitle && (
              <p className="text-white/85 text-xs mt-1 line-clamp-2 drop-shadow">
                {book.subtitle}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* 管理模式按钮:覆盖在卡片上 */}
      {manageMode && (
        <div className="absolute top-2 right-2 flex gap-1.5 z-10">
          <Link
            href={`/editor?book_id=${book.id}`}
            className="bg-white/95 backdrop-blur text-shuishui-brown text-xs font-semibold px-2.5 py-1.5 rounded-full shadow-soft hover:bg-white transition"
            onClick={(e) => e.stopPropagation()}
          >
            编辑
          </Link>
          <button
            onClick={handleDelete}
            disabled={busy === 'delete'}
            className="bg-white/95 backdrop-blur text-tool-red text-xs font-semibold px-2.5 py-1.5 rounded-full shadow-soft hover:bg-tool-red hover:text-white transition disabled:opacity-50"
          >
            {busy === 'delete' ? '…' : '删除'}
          </button>
        </div>
      )}
    </div>
  );
}
