'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Book } from '@/lib/types';
import LibraryBookCard from './LibraryBookCard';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
// 生产部署(GH Pages)上没有 /editor /characters,只读模式;隐藏创作入口
const IS_PROD = BASE_PATH !== '';

export default function LibraryHome({ books }: { books: Book[] }) {
  const [manageMode, setManageMode] = useState(false);

  return (
    <main className="min-h-screen bg-white">
      {/* ━━━ Hero Banner (白底 Tiny Days,与下方书架白底无缝衔接)━━━ */}
      <section className="relative w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${BASE_PATH}/branding/banner.png`}
          alt="Tiny Days"
          className="w-full max-h-[50vh] object-contain mx-auto block"
        />
        {/* 创作 + 角色管理 入口仅在 dev 显示(生产是只读的) */}
        {!IS_PROD && (
          <div className="absolute top-3 right-3 flex gap-2">
            <Link
              href="/characters"
              className="text-xs text-shuishui-brown/70 hover:text-shuishui-brown bg-white/80 backdrop-blur px-3 py-1.5 rounded-full transition border border-shuishui-pink-soft"
            >
              角色
            </Link>
            <Link
              href="/editor"
              className="text-xs font-semibold text-white bg-shuishui-pink-deep hover:bg-shuishui-pink shadow-soft px-3 py-1.5 rounded-full transition"
            >
              ＋ 新建
            </Link>
          </div>
        )}
      </section>

      {/* ━━━ 书架(无背板、无标题、无统计,直接接 banner)━━━ */}
      <section className="px-5 sm:px-8 max-w-5xl mx-auto pt-8 sm:pt-10 pb-16">
        {/* 管理模式 toggle 单独右对齐(只在有书 + dev 显示) */}
        {books.length > 0 && !IS_PROD && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setManageMode((v) => !v)}
              className={`text-xs px-3 py-1.5 rounded-full transition ${
                manageMode
                  ? 'bg-shuishui-pink-deep text-white'
                  : 'bg-shuishui-pink-soft text-shuishui-brown hover:bg-shuishui-pink/40'
              }`}
            >
              {manageMode ? '完成' : '管理'}
            </button>
          </div>
        )}

        {books.length === 0 ? (
          <div className="text-shuishui-brown-soft py-16 text-center">
            <div className="text-6xl mb-3">📖</div>
            <div className="text-sm">
              {IS_PROD ? '还没有出版的绘本' : '还是空空的书架'}
            </div>
            {!IS_PROD && (
              <Link
                href="/editor"
                className="inline-block mt-4 bg-shuishui-pink-deep text-white font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition shadow-soft"
              >
                做第一本
              </Link>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-5 sm:gap-7">
            {books.map((b) => (
              <li key={b.id}>
                <LibraryBookCard book={b} manageMode={manageMode} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
