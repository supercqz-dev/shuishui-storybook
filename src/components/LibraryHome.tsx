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
    // 整页奶油底 lib-shelf(#FFF4E3)。头图底边是同一纯色,满幅贴顶 → 与背景天然无缝。
    <main className="min-h-screen lib-shelf">
      {/* ━━━ Hero:Tiny Days 头图(满幅,底边色 = 页面底色,无需任何过渡处理)━━━ */}
      <section className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${BASE_PATH}/branding/banner.png`}
          alt="Tiny Days — every little moment, a story"
          className="w-full max-w-[1100px] mx-auto block select-none"
          draggable={false}
        />
        {/* 创作 + 角色管理 入口仅在 dev 显示 */}
        {!IS_PROD && (
          <div className="absolute top-3 right-3 flex gap-2">
            <Link
              href="/characters"
              className="text-xs text-shuishui-brown/70 hover:text-shuishui-brown bg-white/70 backdrop-blur px-3 py-1.5 rounded-pill transition border border-white/60 shadow-soft"
            >
              角色
            </Link>
            <Link
              href="/editor"
              className="text-xs font-semibold text-white bg-shuishui-pink-deep hover:bg-shuishui-pink shadow-soft px-3 py-1.5 rounded-pill transition"
            >
              ＋ 新建
            </Link>
          </div>
        )}
      </section>

      {/* ━━━ 书架区(与头图共用同色奶油底,无割裂、无标题)━━━ */}
      <section className="px-5 sm:px-8 max-w-6xl mx-auto pt-2 pb-20">
        {/* 管理 toggle(仅 dev 显示,右对齐) */}
        {books.length > 0 && !IS_PROD && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setManageMode((v) => !v)}
              className={`text-xs px-3.5 py-1.5 rounded-pill transition ${
                manageMode
                  ? 'bg-shuishui-pink-deep text-white shadow-soft'
                  : 'bg-white/70 text-shuishui-brown hover:bg-white border border-white/60'
              }`}
            >
              {manageMode ? '完成' : '管理'}
            </button>
          </div>
        )}

        {books.length === 0 ? (
          <div className="text-shuishui-brown-soft py-20 text-center">
            <div className="text-6xl mb-3">📖</div>
            <div className="text-sm">
              {IS_PROD ? '还没有出版的绘本' : '还是空空的书架'}
            </div>
            {!IS_PROD && (
              <Link
                href="/editor"
                className="inline-block mt-4 bg-shuishui-pink-deep text-white font-semibold px-5 py-2.5 rounded-pill hover:opacity-90 transition shadow-soft"
              >
                做第一本
              </Link>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8 sm:gap-x-7 sm:gap-y-10">
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
