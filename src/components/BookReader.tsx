'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Book } from '@/lib/types';

// GH Pages 部署在子路径 /shuishui-storybook/ 下,而 image_path 在 json 里写的是 /generated/...
// 这里在客户端运行时拼上 basePath。dev 模式 NEXT_PUBLIC_BASE_PATH 为空,不影响。
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
const withBase = (p: string) => (p?.startsWith('/') ? `${BASE_PATH}${p}` : p);

export default function BookReader({ book }: { book: Book }) {
  const [idx, setIdx] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);
  const total = book.pages.length;
  const page = book.pages[idx];
  const touchStart = useRef<number | null>(null);
  const chromeTimer = useRef<number | null>(null);

  const next = () => setIdx((i) => Math.min(i + 1, total - 1));
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  const showChrome = () => {
    setChromeVisible(true);
    if (chromeTimer.current) window.clearTimeout(chromeTimer.current);
    chromeTimer.current = window.setTimeout(() => setChromeVisible(false), 2500);
  };

  useEffect(() => {
    showChrome();
    return () => {
      if (chromeTimer.current) window.clearTimeout(chromeTimer.current);
    };
  }, [idx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') {
        // user can press Esc to go back; default <Link> handles router
      }
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

      <div
        className={`absolute inset-x-0 bottom-0 px-6 pb-10 pt-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white transition-opacity duration-500 ${
          chromeVisible ? 'opacity-100' : 'opacity-0'
        } pointer-events-none`}
      >
        <p className="text-lg leading-relaxed font-medium drop-shadow-md">
          {page.narration}
        </p>
        {page.dialogue && page.dialogue.length > 0 && (
          <div className="mt-3 space-y-1">
            {page.dialogue.map((d, i) => (
              <p key={i} className="text-base">
                <span className="font-semibold text-shuishui-pink-soft mr-1.5">
                  {d.speaker}：
                </span>
                「{d.text}」
              </p>
            ))}
          </div>
        )}
      </div>

      <div
        className={`absolute top-0 inset-x-0 px-4 pt-3 pb-6 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between text-white transition-opacity duration-500 ${
          chromeVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Link
          href="/"
          onClick={(e) => e.stopPropagation()}
          className={`text-sm bg-black/30 backdrop-blur px-3 py-1.5 rounded-full ${
            chromeVisible ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          ← 书架
        </Link>
        <div className="flex gap-1.5">
          {book.pages.map((_, i) => (
            <span
              key={i}
              className={`block h-1 rounded-full transition-all ${
                i === idx
                  ? 'w-6 bg-white'
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
