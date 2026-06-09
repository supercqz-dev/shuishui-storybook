'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Book } from '@/lib/types';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
// 生图产物已离线转成体积小 ~9 倍的 WebP(保留同名 PNG 原图可回滚)。
const toWebp = (p?: string) =>
  p && p.includes('/generated/') && p.endsWith('.png') ? p.replace(/\.png$/, '.webp') : p;
const withBase = (p?: string) => {
  const w = toWebp(p);
  return w?.startsWith('/') ? `${BASE_PATH}${w}` : w;
};

export default function BookReader({ book }: { book: Book }) {
  // 翻页结构:
  //   idx = 0          → 封面 (cover.png 或第一页 fallback)
  //   idx = 1..N       → 内容页(book.pages[idx-1])
  //   idx = N+1        → "读完啦" 结束页
  const contentTotal = book.pages.length;
  const endIdx = contentTotal + 1;

  const [idx, setIdx] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const hintTimer = useRef<number | null>(null);

  const isCover = idx === 0;
  const isEnd = idx === endIdx;
  const contentPage = !isCover && !isEnd ? book.pages[idx - 1] : null;

  const next = () => setIdx((i) => Math.min(i + 1, endIdx));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  // 翻页后回到顶部(否则上一页滚到底,下一页会保留滚动位置)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [idx]);

  useEffect(() => {
    hintTimer.current = window.setTimeout(() => setShowHint(false), 5000);
    return () => {
      if (hintTimer.current) window.clearTimeout(hintTimer.current);
    };
  }, []);

  useEffect(() => {
    if (idx > 0 && showHint) setShowHint(false);
  }, [idx, showHint]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 触摸滑动:只有主轴是横向(且位移>50px)才翻页,纵向交给浏览器原生滚动
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
    touchStart.current = null;
  };

  // 桌面/触摸点击热区:左 30% / 右 30% / 中间不响应。
  // 浏览器在"无明显移动"的 touchend 后才合成 click,所以滚动不会误触。
  const onTap = (e: React.MouseEvent) => {
    const w = window.innerWidth;
    const x = e.clientX;
    if (x < w * 0.3) prev();
    else if (x > w * 0.7) next();
  };

  // ━━━ 结束页(独立全屏 splash,不参与滚动布局)━━━
  if (isEnd) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-shuishui-pink-soft via-cream-50 to-shuishui-yellow flex flex-col items-center justify-center px-6 select-none">
        <div className="text-7xl mb-6 animate-gentle-bounce">✨</div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-shuishui-brown text-center">
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

  const imgSrc = isCover
    ? book.cover_image ?? book.pages[0]?.image_path ?? ''
    : contentPage?.image_path ?? '';

  return (
    <div
      className="min-h-screen bg-cream-bg select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={onTap}
    >
      {/* ━━━ 图:撑满屏幕宽度,按原比例完整显示 ━━━ */}
      <div className="w-full bg-cream-100">
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`page-${idx}`}
            src={withBase(imgSrc)}
            alt={isCover ? `封面:${book.title}` : `第 ${contentPage?.page} 页`}
            loading={isCover ? 'eager' : 'lazy'}
            decoding="async"
            className="w-full h-auto block"
          />
        ) : (
          <PlaceholderArt page={contentPage} title={book.title} />
        )}
      </div>

      {/* ━━━ 翻页指示点 ━━━ */}
      <div className="flex items-center justify-center gap-1.5 pt-4 px-5">
        <span
          className={`block h-1.5 rounded-full transition-all ${
            isCover ? 'w-6 bg-shuishui-pink-deep' : 'w-1.5 bg-shuishui-brown-soft/30'
          }`}
        />
        {book.pages.map((_, i) => {
          const pageIdx = i + 1;
          return (
            <span
              key={i}
              className={`block h-1.5 rounded-full transition-all ${
                idx === pageIdx
                  ? 'w-6 bg-shuishui-pink-deep'
                  : idx > pageIdx
                  ? 'w-2 bg-shuishui-brown-soft/60'
                  : 'w-2 bg-shuishui-brown-soft/30'
              }`}
            />
          );
        })}
      </div>

      {/* ━━━ 文字:封面=标题副标题,内容页=旁白+对话(自然向下流) ━━━ */}
      <div className="px-5 sm:px-8 pt-4 pb-12">
        {isCover ? (
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-shuishui-brown leading-tight">
              {book.title}
            </h1>
            {book.subtitle && (
              <p className="font-kid text-sm sm:text-base text-shuishui-brown-soft mt-1">
                {book.subtitle}
              </p>
            )}
            <p className="text-xs text-shuishui-brown-soft/70 mt-3">
              👆 滑屏 / 按 → 开始阅读
            </p>
          </div>
        ) : contentPage ? (
          <div className="max-w-2xl mx-auto">
            <p className="text-base sm:text-lg leading-relaxed text-shuishui-brown">
              {contentPage.narration}
            </p>
            {contentPage.dialogue && contentPage.dialogue.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {contentPage.dialogue.map((d, i) => (
                  <p key={i} className="text-sm sm:text-base text-shuishui-brown-soft">
                    <span className="font-bold text-shuishui-pink-deep mr-1.5">
                      {d.speaker}:
                    </span>
                    「{d.text}」
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* 返回按钮:fixed,翻到任何页都可见(不被滚动带走) */}
      <Link
        href="/"
        onClick={(e) => e.stopPropagation()}
        aria-label="返回书架"
        className="fixed top-3 left-3 z-50 w-10 h-10 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white text-xl hover:bg-black/50 transition active:scale-90"
      >
        ‹
      </Link>

      {/* 首次进入提示(只在封面页) */}
      {showHint && isCover && (
        <div className="fixed inset-x-0 bottom-6 pointer-events-none flex justify-center z-40">
          <div className="bg-shuishui-brown/85 text-cream-50 text-xs px-4 py-2 rounded-full animate-soft-pulse">
            👆 左右滑翻页 / 上下滑滚动 / 按 →
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceholderArt({
  page,
  title,
}: {
  page: Book['pages'][number] | null;
  title: string;
}) {
  return (
    <div className="aspect-[2/3] w-full flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-shuishui-pink-soft via-cream-50 to-shuishui-yellow">
      <div className="text-7xl mb-4">📖</div>
      <p className="text-sm text-shuishui-brown-soft">
        {page?.scene_state.location ?? title}
      </p>
    </div>
  );
}
