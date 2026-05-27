'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Book } from '@/lib/types';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
const withBase = (p: string) => (p?.startsWith('/') ? `${BASE_PATH}${p}` : p);

export default function BookReader({ book }: { book: Book }) {
  const total = book.pages.length;
  // idx 范围:0..total-1 是正常页;total 是"读完啦"结束页
  const [idx, setIdx] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [showHint, setShowHint] = useState(true);
  const touchStart = useRef<number | null>(null);
  const chromeTimer = useRef<number | null>(null);
  const hintTimer = useRef<number | null>(null);

  const isEndPage = idx === total;
  const page = isEndPage ? null : book.pages[idx];

  const next = () => setIdx((i) => Math.min(i + 1, total));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  const showChrome = () => {
    setChromeVisible(true);
    if (chromeTimer.current) window.clearTimeout(chromeTimer.current);
    chromeTimer.current = window.setTimeout(() => setChromeVisible(false), 3500);
  };

  // 翻页时刷新 chrome 显示;翻一次后隐藏首次提示
  useEffect(() => {
    showChrome();
    if (idx > 0 && showHint) {
      setShowHint(false);
      if (hintTimer.current) window.clearTimeout(hintTimer.current);
    }
    return () => {
      if (chromeTimer.current) window.clearTimeout(chromeTimer.current);
    };
  }, [idx]);

  // 首次提示 5 秒后自动淡出
  useEffect(() => {
    hintTimer.current = window.setTimeout(() => setShowHint(false), 5000);
    return () => {
      if (hintTimer.current) window.clearTimeout(hintTimer.current);
    };
  }, []);

  // 键盘左右翻页
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (dx < -50) next();
    else if (dx > 50) prev();
    touchStart.current = null;
  };

  const onTap = (e: React.MouseEvent) => {
    const w = window.innerWidth;
    const x = e.clientX;
    if (x < w * 0.3) prev();
    else if (x > w * 0.7) next();
    else showChrome();
  };

  // ━━━ 结束页 ━━━
  if (isEndPage) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-shuishui-pink-soft via-cream-50 to-shuishui-yellow flex flex-col items-center justify-center px-6 select-none">
        <div className="text-8xl mb-6 animate-gentle-bounce">✨</div>
        <h1 className="text-4xl sm:text-5xl font-bold text-shuishui-brown text-center">
          读完啦!
        </h1>
        <p className="text-lg text-shuishui-brown-soft mt-3 text-center">
          《{book.title}》
        </p>
        <p className="text-sm text-shuishui-brown-soft/80 mt-1 text-center max-w-xs">
          {book.moral}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-10 w-full max-w-xs">
          <button
            onClick={() => setIdx(0)}
            className="flex-1 bg-white text-shuishui-brown font-semibold py-3.5 rounded-full shadow-soft hover:shadow-soft-lg active:scale-95 transition"
          >
            🔁 再读一遍
          </button>
          <Link
            href="/"
            className="flex-1 bg-shuishui-pink-deep text-white font-semibold py-3.5 rounded-full shadow-soft hover:shadow-soft-lg active:scale-95 transition text-center"
          >
            📚 回书架
          </Link>
        </div>
      </div>
    );
  }

  if (!page) return null;

  return (
    <div
      className="fixed inset-0 bg-black select-none touch-none overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={onTap}
    >
      {page.image_path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={withBase(page.image_path)}
          alt={`第 ${page.page} 页`}
          className="absolute inset-0 w-full h-full object-contain"
        />
      ) : (
        <PlaceholderArt page={page} />
      )}

      {/* 旁白 + 对话区 */}
      <div
        className={`absolute inset-x-0 bottom-0 px-6 pb-10 pt-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white transition-opacity duration-500 ${
          chromeVisible ? 'opacity-100' : 'opacity-0'
        } pointer-events-none`}
      >
        <p className="text-lg sm:text-xl leading-relaxed font-medium drop-shadow-md">
          {page.narration}
        </p>
        {page.dialogue && page.dialogue.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {page.dialogue.map((d, i) => (
              <p key={i} className="text-base sm:text-lg">
                <span className="font-bold text-shuishui-pink-soft mr-1.5">
                  {d.speaker}:
                </span>
                「{d.text}」
              </p>
            ))}
          </div>
        )}
      </div>

      {/* 顶部 chrome:回书架 + 进度 + 页码 */}
      <div
        className={`absolute top-0 inset-x-0 px-3 pt-3 pb-6 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between text-white transition-opacity duration-500 ${
          chromeVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Link
          href="/"
          onClick={(e) => e.stopPropagation()}
          className={`flex items-center gap-1 text-sm font-medium bg-black/40 backdrop-blur px-4 py-2.5 rounded-full ${
            chromeVisible ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          ← 书架
        </Link>
        <div className="flex gap-1.5">
          {book.pages.map((_, i) => (
            <span
              key={i}
              className={`block h-1.5 rounded-full transition-all ${
                i === idx
                  ? 'w-7 bg-white'
                  : i < idx
                  ? 'w-2 bg-white/70'
                  : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>
        <span className="text-xs tabular-nums opacity-70 w-10 text-right">
          {idx + 1}/{total}
        </span>
      </div>

      {/* 首次进入提示 */}
      {showHint && idx === 0 && (
        <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-32 sm:pb-40">
          <div className="bg-black/60 backdrop-blur text-white text-sm px-5 py-2.5 rounded-full animate-soft-pulse">
            👆 轻轻滑屏(或按 →)开始阅读
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceholderArt({ page }: { page: Book['pages'][number] }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-shuishui-pink-soft via-white to-yellow-50">
      <div className="text-8xl mb-6">
        {emojiFor(page.scene_state.location, page.characters_in_scene)}
      </div>
      <p className="text-xs text-gray-400 max-w-xs">
        {page.scene_state.location}
        {page.scene_state.weather && ` · ${page.scene_state.weather}`}
      </p>
      <p className="text-[10px] text-gray-300 mt-3">
        [图像占位 · gpt-image-2 渲染后替换]
      </p>
    </div>
  );
}

function emojiFor(location: string, characters: string[]): string {
  const main = characters[0] ?? '';
  const c =
    main === 'shuishui' ? '🐰' :
    main === 'mama' ? '🐇' :
    main === 'papa' ? '🦊' :
    main === 'laolao' ? '🐑' : '🐰';
  const loc =
    /雨|雨水/.test(location) ? '🌧️' :
    /幼儿园|学校/.test(location) ? '🏫' :
    /家|门口/.test(location) ? '🏠' :
    /公园/.test(location) ? '🌳' :
    /街/.test(location) ? '🛣️' : '✨';
  return `${c}${loc}`;
}
