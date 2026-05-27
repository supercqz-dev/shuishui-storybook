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
    <main className="min-h-screen bg-cream-50">
      {/* ━━━ Hero Banner ━━━ */}
      <section className="relative w-full overflow-hidden">
        <div
          className="aspect-[3/2] sm:aspect-[5/2] w-full bg-gradient-to-br from-shuishui-pink-soft via-cream-100 to-shuishui-yellow"
          style={{
            backgroundImage: `url('${BASE_PATH}/branding/banner-zh.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* 创作 + 角色管理 入口仅在 dev 显示(生产是只读的) */}
        {!IS_PROD && (
          <div className="absolute top-3 right-3 flex gap-2">
            <Link
              href="/characters"
              className="text-xs text-shuishui-brown/70 hover:text-shuishui-brown bg-white/70 backdrop-blur px-3 py-1.5 rounded-full transition"
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

      {/* ━━━ 书架 ━━━ */}
      <section className="px-5 sm:px-8 max-w-5xl mx-auto -mt-8 sm:-mt-12 relative z-10 pb-16">
        <div className="bg-cream-50 rounded-t-[2.5rem] sm:rounded-[2.5rem] pt-8 sm:pt-10 px-2 sm:px-6">
          <header className="flex items-baseline justify-between mb-6 px-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-shuishui-brown">
                我的书架
              </h2>
              <p className="text-xs sm:text-sm text-shuishui-brown-soft mt-1">
                {books.length > 0
                  ? `共 ${books.length} 本绘本`
                  : '还没有绘本——点右上角"+新建"开始'}
              </p>
            </div>
            {books.length > 0 && !IS_PROD && (
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
            )}
          </header>

          {books.length === 0 ? (
            <div className="text-shuishui-brown-soft py-16 text-center bg-cream-100 rounded-3xl">
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
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 px-1 sm:px-2">
              {books.map((b) => (
                <li key={b.id}>
                  <LibraryBookCard book={b} manageMode={manageMode} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
