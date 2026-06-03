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
      {/* 封面卡:2:3 竖版,白底圆角,静态柔投影 → hover 抬升+强投影。
          白色描边圈一圈,像陈列在馆里的精装绘本。 */}
      <Link
        href={`/books/${book.id}`}
        className="block aspect-[2/3] rounded-book overflow-hidden relative bg-cream-card ring-1 ring-white/70 shadow-book hover:shadow-book-hover hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 ease-out"
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={withBase(cover)}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl bg-cream-100">
            🐰
          </div>
        )}
      </Link>

      {/* 标题(英文,圆体 display)+ 中文副标题(Noto)*/}
      <div className="mt-3 px-0.5">
        <h3 className="font-display text-book-title text-shuishui-brown line-clamp-2">
          {book.title}
        </h3>
        {book.subtitle && (
          <p className="font-kid text-book-subtitle text-shuishui-brown-soft mt-1 line-clamp-1">
            {book.subtitle}
          </p>
        )}
      </div>

      {/* 管理模式按钮 */}
      {manageMode && (
        <div className="absolute top-2 right-2 flex gap-1.5 z-10">
          <Link
            href={`/editor?book_id=${book.id}`}
            className="bg-white/95 backdrop-blur text-shuishui-brown text-xs font-semibold px-2.5 py-1.5 rounded-pill shadow-soft hover:bg-white transition"
            onClick={(e) => e.stopPropagation()}
          >
            编辑
          </Link>
          <button
            onClick={handleDelete}
            disabled={busy === 'delete'}
            className="bg-white/95 backdrop-blur text-tool-red text-xs font-semibold px-2.5 py-1.5 rounded-pill shadow-soft hover:bg-tool-red hover:text-white transition disabled:opacity-50"
          >
            {busy === 'delete' ? '…' : '删除'}
          </button>
        </div>
      )}
    </div>
  );
}
