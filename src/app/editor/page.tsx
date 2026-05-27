'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Book, Page } from '@/lib/types';

type Character = { id: string; name_cn: string; has_ref: boolean };

type StoryDraft = {
  title: string;
  subtitle: string;
  theme: string;
  moral: string;
  pages: Page[];
};

type Phase = 'form' | 'generating-story' | 'loading-book' | 'review';

export default function EditorWrapper() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-400">加载中…</div>}>
      <Editor />
    </Suspense>
  );
}

function Editor() {
  const searchParams = useSearchParams();
  const editingBookId = searchParams.get('book_id');

  const [phase, setPhase] = useState<Phase>(editingBookId ? 'loading-book' : 'form');

  const [trigger, setTrigger] = useState('');
  const [educationGoal, setEducationGoal] = useState('');
  const [chars, setChars] = useState<Character[]>([]);
  const [pickedChars, setPickedChars] = useState<string[]>(['shuishui']);
  const [error, setError] = useState<string | null>(null);

  const [story, setStory] = useState<StoryDraft | null>(null);
  const [bookId, setBookId] = useState<string>(editingBookId || '');
  const [imagePaths, setImagePaths] = useState<Record<number, string>>({});
  const [renderingPage, setRenderingPage] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [isEditing, setIsEditing] = useState(!!editingBookId);

  useEffect(() => {
    fetch('/api/characters/')
      .then((r) => r.json())
      .then((d) => setChars(d.characters || []))
      .catch(() => {});
  }, []);

  // 加载已有 book 进 review 阶段
  useEffect(() => {
    if (!editingBookId) return;
    fetch(`/api/books/${editingBookId}/`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
        const book = d.book as Book;
        setStory({
          title: book.title,
          subtitle: book.subtitle || '',
          theme: book.theme,
          moral: book.moral,
          pages: book.pages,
        });
        // 把已有 image_path 填到 imagePaths(带 cache-bust 防浏览器缓存)
        const existing: Record<number, string> = {};
        for (const p of book.pages) {
          if (p.image_path) {
            existing[p.page] = `${p.image_path}?t=${Date.now()}`;
          }
        }
        setImagePaths(existing);
        setPhase('review');
      })
      .catch((e) => {
        setError(`加载 book 失败: ${e instanceof Error ? e.message : String(e)}`);
        setPhase('form');
        setIsEditing(false);
      });
  }, [editingBookId]);

  function toggleChar(id: string) {
    if (id === 'shuishui') return;
    setPickedChars((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleGenerateStory() {
    setError(null);
    if (!trigger.trim() || !educationGoal.trim()) {
      setError('请填写"今天发生的小事"和"想让她学到什么"');
      return;
    }
    setPhase('generating-story');
    try {
      const res = await fetch('/api/generate-story/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          trigger,
          education_goal: educationGoal,
          characters_in_book: pickedChars,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setStory(data.story as StoryDraft);
      setBookId(makeBookId(data.story.title));
      setIsEditing(false);
      setPhase('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('form');
    }
  }

  async function renderPage(p: Page) {
    if (!story) return;
    setRenderingPage(p.page);
    setError(null);
    try {
      const res = await fetch('/api/generate-image/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ page: p, book_id: bookId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setImagePaths((prev) => ({ ...prev, [p.page]: `${data.image_path}?t=${Date.now()}` }));
    } catch (e) {
      setError(`第 ${p.page} 页生成失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRenderingPage(null);
    }
  }

  function updatePage(idx: number, patch: Partial<Page>) {
    if (!story) return;
    const next = [...story.pages];
    next[idx] = { ...next[idx], ...patch };
    setStory({ ...story, pages: next });
  }

  async function publish() {
    if (!story || !bookId) return;
    setPublishing(true);
    setError(null);
    try {
      const allRendered = story.pages.every((p) => imagePaths[p.page]);
      if (!allRendered) {
        const ok = confirm('还有页没生成插画，确定要先保存吗？');
        if (!ok) {
          setPublishing(false);
          return;
        }
      }
      const book: Book = {
        id: bookId,
        title: story.title,
        subtitle: story.subtitle,
        theme: story.theme,
        moral: story.moral,
        age_target: '3-4',
        cover_image: imagePaths[1]?.split('?')[0],
        pages: story.pages.map((p) => ({
          ...p,
          image_path: imagePaths[p.page]?.split('?')[0],
        })),
        created_at: new Date().toISOString(),
        status: 'finished',
      };
      const res = await fetch('/api/save-book/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(book),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      window.location.href = `/books/${bookId}/`;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPublishing(false);
    }
  }

  if (phase === 'loading-book') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">📚 加载绘本中…</div>
      </main>
    );
  }

  if (phase === 'form' || phase === 'generating-story') {
    return (
      <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
        <Link href="/" className="text-gray-500 text-sm">← 返回书架</Link>
        <h1 className="text-3xl font-bold mt-4">新建绘本</h1>

        <div className="mt-8 space-y-6">
          <Field
            label="📝 今天发生的小事"
            hint="详细一点，越具体故事越温暖。例如：「下雨了，水水不想穿雨鞋。」"
          >
            <textarea
              className="w-full mt-2 p-3 rounded-xl border border-gray-200 focus:border-shuishui-pink focus:outline-none min-h-[120px] resize-none"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="今天水水……"
              disabled={phase === 'generating-story'}
            />
          </Field>

          <Field
            label="🎯 想让她学到什么"
            hint="一句话即可。例如：「下雨穿雨鞋是为了脚舒服，不是为了好看。」"
          >
            <textarea
              className="w-full mt-2 p-3 rounded-xl border border-gray-200 focus:border-shuishui-pink focus:outline-none min-h-[80px] resize-none"
              value={educationGoal}
              onChange={(e) => setEducationGoal(e.target.value)}
              placeholder="希望她明白……"
              disabled={phase === 'generating-story'}
            />
          </Field>

          <Field label="👥 出场角色" hint="水水必选；其他角色按需勾">
            <div className="mt-3 grid grid-cols-2 gap-2">
              {chars.map((c) => {
                const picked = pickedChars.includes(c.id);
                const locked = c.id === 'shuishui';
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleChar(c.id)}
                    disabled={locked || phase === 'generating-story'}
                    className={`p-3 rounded-xl border-2 text-left transition ${
                      picked
                        ? 'border-shuishui-pink bg-shuishui-pink-soft'
                        : 'border-gray-200 bg-white'
                    } ${locked ? 'opacity-90 cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="font-semibold">{c.name_cn}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {locked ? '主角（必选）' : picked ? '已选' : '点击加入'}
                      {c.has_ref ? ' · 已有定妆' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerateStory}
            disabled={phase === 'generating-story'}
            className="w-full bg-shuishui-pink text-white font-semibold py-4 rounded-2xl hover:opacity-90 active:scale-95 transition disabled:opacity-60"
          >
            {phase === 'generating-story' ? '✨ 故事编织中…（约 30-60 秒）' : '✨ 生成故事'}
          </button>
        </div>
      </main>
    );
  }

  if (!story) return null;

  return (
    <main className="min-h-screen px-6 py-8 max-w-3xl mx-auto pb-32">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (isEditing) {
              window.location.href = '/';
            } else if (confirm('返回会丢掉这个故事，确定吗？')) {
              setPhase('form');
            }
          }}
          className="text-gray-500 text-sm"
        >
          ← {isEditing ? '返回书架' : '重新写'}
        </button>
        {isEditing && (
          <span className="text-xs text-shuishui-pink bg-shuishui-pink-soft px-2 py-1 rounded-full">
            正在编辑《{story.title}》
          </span>
        )}
      </div>

      <div className="mt-4">
        <input
          className="text-3xl font-bold w-full bg-transparent focus:outline-none"
          value={story.title}
          onChange={(e) => setStory({ ...story, title: e.target.value })}
        />
        <input
          className="text-gray-500 mt-1 w-full bg-transparent focus:outline-none"
          value={story.subtitle}
          onChange={(e) => setStory({ ...story, subtitle: e.target.value })}
        />
        <div className="text-xs text-gray-400 mt-2">
          主题：{story.theme} · 道德：{story.moral}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-6">
        {story.pages.map((p, idx) => (
          <PageCard
            key={p.page}
            page={p}
            imageUrl={imagePaths[p.page]}
            rendering={renderingPage === p.page}
            anyRendering={renderingPage !== null}
            onUpdate={(patch) => updatePage(idx, patch)}
            onRender={() => renderPage(p)}
          />
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 items-center justify-between max-w-3xl mx-auto">
        <div className="text-xs text-gray-500">
          {Object.keys(imagePaths).length} / {story.pages.length} 页已生成插画
        </div>
        <button
          onClick={publish}
          disabled={publishing}
          className="bg-shuishui-pink text-white font-semibold px-6 py-3 rounded-2xl hover:opacity-90 active:scale-95 transition disabled:opacity-60"
        >
          {publishing ? '保存中…' : '📚 保存并出版'}
        </button>
      </div>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-semibold text-gray-800">{label}</label>
      {hint && <div className="text-xs text-gray-500 mt-0.5">{hint}</div>}
      {children}
    </div>
  );
}

function PageCard({
  page,
  imageUrl,
  rendering,
  anyRendering,
  onUpdate,
  onRender,
}: {
  page: Page;
  imageUrl?: string;
  rendering: boolean;
  anyRendering: boolean;
  onUpdate: (patch: Partial<Page>) => void;
  onRender: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="aspect-[2/3] bg-gray-100 relative">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={`第 ${page.page} 页`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {rendering ? '🎨 绘制中…（约 1 分钟）' : '尚未生成插画'}
          </div>
        )}
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          第 {page.page} 页 · {page.shot} · {page.emotion}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">旁白</div>
          <textarea
            className="w-full p-2 rounded-lg border border-gray-200 focus:border-shuishui-pink focus:outline-none text-sm resize-none"
            rows={2}
            value={page.narration}
            onChange={(e) => onUpdate({ narration: e.target.value })}
          />
        </div>

        {page.dialogue && page.dialogue.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-1">对话</div>
            <div className="space-y-1">
              {page.dialogue.map((d, i) => (
                <div key={i} className="text-sm bg-gray-50 p-2 rounded-lg">
                  <span className="font-semibold mr-2">{d.speaker}:</span>
                  {d.text}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          📍 {page.scene_state.location} · {page.scene_state.weather || '—'} ·{' '}
          {page.scene_state.time_of_day || '—'}
        </div>

        <button
          onClick={onRender}
          disabled={anyRendering}
          className="w-full mt-2 py-2 rounded-xl bg-shuishui-pink-soft text-gray-800 font-medium hover:bg-shuishui-pink hover:text-white transition disabled:opacity-50"
        >
          {rendering ? '生成中…' : imageUrl ? '🎨 重新生成插画' : '🎨 生成插画'}
        </button>
      </div>
    </div>
  );
}

function makeBookId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/[一-龥]/g, '');
  const base = slug || 'book';
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${base || 'book'}-${stamp}-${Math.random().toString(36).slice(2, 6)}`;
}
