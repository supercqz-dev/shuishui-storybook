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

const TRIGGER_INSPIRATIONS = [
  '今天水水不肯吃青菜',
  '幼儿园午睡又睡不着',
  '第一次自己穿鞋',
  '遇到陌生人她躲到妈妈身后',
  '想要新玩具妈妈不同意',
];

export default function EditorWrapper() {
  return (
    <Suspense fallback={<ToolMain><Loading /></ToolMain>}>
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
  const [renderingPages, setRenderingPages] = useState<Set<number>>(new Set());
  const [pageErrors, setPageErrors] = useState<Record<number, string>>({});
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
        const existing: Record<number, string> = {};
        for (const p of book.pages) {
          if (p.image_path) existing[p.page] = `${p.image_path}?t=${Date.now()}`;
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
    setRenderingPages((s) => new Set(s).add(p.page));
    setPageErrors((e) => {
      const next = { ...e };
      delete next[p.page];
      return next;
    });
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
      const msg = e instanceof Error ? e.message : String(e);
      setPageErrors((prev) => ({ ...prev, [p.page]: msg }));
    } finally {
      setRenderingPages((s) => {
        const next = new Set(s);
        next.delete(p.page);
        return next;
      });
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
        const ok = confirm('还有页没生成插画,确定要先保存吗?');
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

  // ━━━ 加载中 ━━━
  if (phase === 'loading-book') {
    return <ToolMain><Loading hint="加载绘本中…" /></ToolMain>;
  }

  // ━━━ 表单阶段 ━━━
  if (phase === 'form' || phase === 'generating-story') {
    const generating = phase === 'generating-story';
    return (
      <ToolMain>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <Link href="/" className="text-sm text-tool-ink-soft hover:text-tool-ink">
            ← 返回书架
          </Link>
          <h1 className="text-3xl font-bold text-tool-ink mt-3">新建绘本</h1>
          <p className="text-sm text-tool-ink-soft mt-1">
            填生活素材 + 教育目标,LLM 写 8 页 storyboard,你审核 → 逐页生图 → 出版
          </p>

          <div className="mt-8 space-y-6">
            <Field
              label="今天发生的小事"
              hint="越具体故事越温暖。例:「下雨了,水水不想穿雨鞋」"
            >
              <textarea
                className="w-full mt-2 p-3 rounded-lg border border-tool-border focus:border-tool-accent focus:ring-1 focus:ring-tool-accent focus:outline-none min-h-[110px] resize-none text-sm bg-tool-card"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="今天水水……"
                disabled={generating}
              />
              {/* 灵感 chip */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TRIGGER_INSPIRATIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTrigger(t)}
                    disabled={generating}
                    className="text-xs text-tool-ink-soft bg-tool-card border border-tool-border px-2.5 py-1 rounded-full hover:border-tool-accent hover:text-tool-accent transition"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>

            <Field
              label="想让她学到什么"
              hint="一句话即可。例:「下雨穿雨鞋是为了脚舒服」"
            >
              <textarea
                className="w-full mt-2 p-3 rounded-lg border border-tool-border focus:border-tool-accent focus:ring-1 focus:ring-tool-accent focus:outline-none min-h-[70px] resize-none text-sm bg-tool-card"
                value={educationGoal}
                onChange={(e) => setEducationGoal(e.target.value)}
                placeholder="希望她明白……"
                disabled={generating}
              />
            </Field>

            <Field label="出场角色" hint="水水必选;其他角色按需勾">
              <div className="mt-3 grid grid-cols-2 gap-2">
                {chars.map((c) => {
                  const picked = pickedChars.includes(c.id);
                  const locked = c.id === 'shuishui';
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleChar(c.id)}
                      disabled={locked || generating}
                      className={`p-3 rounded-lg border text-left transition ${
                        picked
                          ? 'border-tool-accent bg-tool-accent/10 text-tool-accent'
                          : 'border-tool-border bg-tool-card text-tool-ink hover:border-tool-ink-soft'
                      } ${locked ? 'opacity-90 cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="font-semibold text-sm">{c.name_cn}</div>
                      <div className="text-xs text-tool-ink-soft mt-0.5">
                        {locked ? '主角(必选)' : picked ? '已选' : '点击加入'}
                        {c.has_ref ? ' · 已定妆' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Field>

            {error && <ErrorBox>{error}</ErrorBox>}

            <button
              onClick={handleGenerateStory}
              disabled={generating}
              className="w-full bg-tool-accent text-white font-semibold py-3.5 rounded-lg hover:opacity-90 active:scale-[0.99] transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Spinner /> 故事编织中… 约 30-60s
                </>
              ) : (
                '生成故事'
              )}
            </button>
          </div>
        </div>
      </ToolMain>
    );
  }

  if (!story) return null;

  // ━━━ Review / 编辑阶段 ━━━
  const renderedCount = Object.keys(imagePaths).length;
  const totalPages = story.pages.length;
  const progressPct = (renderedCount / totalPages) * 100;

  return (
    <ToolMain>
      <div className="max-w-3xl mx-auto px-6 py-6 pb-36">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (isEditing) {
                window.location.href = '/';
              } else if (confirm('返回会丢掉这个故事,确定吗?')) {
                setPhase('form');
              }
            }}
            className="text-sm text-tool-ink-soft hover:text-tool-ink"
          >
            ← {isEditing ? '返回书架' : '重新写'}
          </button>
          {isEditing && (
            <span className="text-xs font-medium text-tool-purple bg-tool-purple/10 px-2.5 py-1 rounded-full">
              编辑模式
            </span>
          )}
        </div>

        <div className="mt-5">
          <input
            className="text-3xl font-bold w-full bg-transparent focus:outline-none text-tool-ink"
            value={story.title}
            onChange={(e) => setStory({ ...story, title: e.target.value })}
          />
          <input
            className="text-tool-ink-soft mt-1 w-full bg-transparent focus:outline-none text-sm"
            value={story.subtitle}
            onChange={(e) => setStory({ ...story, subtitle: e.target.value })}
            placeholder="副标题"
          />
          <div className="text-xs text-tool-ink-soft mt-2 flex flex-wrap gap-x-3 gap-y-1">
            <span>主题: <span className="text-tool-ink">{story.theme}</span></span>
            <span>道理: <span className="text-tool-ink">{story.moral}</span></span>
          </div>
        </div>

        {error && <div className="mt-4"><ErrorBox>{error}</ErrorBox></div>}

        <div className="mt-8 space-y-4">
          {story.pages.map((p, idx) => (
            <PageCard
              key={p.page}
              page={p}
              imageUrl={imagePaths[p.page]}
              rendering={renderingPages.has(p.page)}
              error={pageErrors[p.page]}
              onUpdate={(patch) => updatePage(idx, patch)}
              onRender={() => renderPage(p)}
            />
          ))}
        </div>
      </div>

      {/* sticky 底部:进度 + 出版 */}
      <div className="fixed bottom-0 left-0 right-0 bg-tool-card/95 backdrop-blur border-t border-tool-border">
        <div className="max-w-3xl mx-auto px-6 py-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-xs text-tool-ink-soft tabular-nums">
              {renderedCount}/{totalPages} 页
            </div>
            <div className="flex-1 h-1.5 bg-tool-border rounded-full overflow-hidden">
              <div
                className="h-full bg-tool-accent transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {renderingPages.size > 0 && (
              <div className="text-xs text-tool-purple flex items-center gap-1">
                <Spinner /> {renderingPages.size} 张生成中
              </div>
            )}
          </div>
          <button
            onClick={publish}
            disabled={publishing}
            className="w-full bg-tool-accent text-white font-semibold py-3 rounded-lg hover:opacity-90 active:scale-[0.99] transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {publishing ? (
              <><Spinner /> 保存中…</>
            ) : isEditing ? (
              '💾 更新这本绘本'
            ) : (
              '📚 保存并出版'
            )}
          </button>
        </div>
      </div>
    </ToolMain>
  );
}

// ━━━ 子组件 ━━━

function ToolMain({ children }: { children: React.ReactNode }) {
  return (
    <main className="tool-app min-h-screen bg-tool-bg text-tool-ink">
      {children}
    </main>
  );
}

function Loading({ hint = '加载中…' }: { hint?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-tool-ink-soft">
      <Spinner size={24} />
      <p className="mt-3 text-sm">{hint}</p>
    </div>
  );
}

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3 bg-tool-red/10 border border-tool-red/30 rounded-lg text-tool-red text-sm">
      {children}
    </div>
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
      <label className="block font-semibold text-sm text-tool-ink">{label}</label>
      {hint && <div className="text-xs text-tool-ink-soft mt-0.5">{hint}</div>}
      {children}
    </div>
  );
}

function PageCard({
  page,
  imageUrl,
  rendering,
  error,
  onUpdate,
  onRender,
}: {
  page: Page;
  imageUrl?: string;
  rendering: boolean;
  error?: string;
  onUpdate: (patch: Partial<Page>) => void;
  onRender: () => void;
}) {
  return (
    <div className="bg-tool-card rounded-xl border border-tool-border shadow-card overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* 图区 */}
        <div className="sm:w-44 sm:flex-shrink-0 aspect-[2/3] sm:aspect-auto sm:min-h-[260px] bg-gradient-to-br from-tool-bg to-tool-border/30 relative">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={`第 ${page.page} 页`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-tool-ink-soft text-xs gap-2">
              {rendering ? (
                <>
                  <Spinner size={20} />
                  <span>绘制中…</span>
                  <span className="text-[10px] opacity-60">约 1 分钟</span>
                </>
              ) : (
                <span>未生成</span>
              )}
            </div>
          )}
          <div className="absolute top-2 left-2 bg-tool-ink/85 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur">
            P{page.page} · {page.shot} · {page.emotion}
          </div>
          {rendering && imageUrl && (
            <div className="absolute inset-0 bg-tool-ink/40 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-tool-card text-tool-ink text-xs px-3 py-2 rounded-lg flex items-center gap-2 shadow-card">
                <Spinner size={14} /> 重新绘制中…
              </div>
            </div>
          )}
        </div>

        {/* 文字 + 操作 */}
        <div className="flex-1 p-4 space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-tool-ink-soft mb-1">旁白</div>
            <textarea
              className="w-full p-2 rounded-md border border-tool-border focus:border-tool-accent focus:outline-none text-sm resize-none bg-tool-card"
              rows={2}
              value={page.narration}
              onChange={(e) => onUpdate({ narration: e.target.value })}
            />
          </div>

          {page.dialogue && page.dialogue.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-tool-ink-soft mb-1">对话</div>
              <div className="space-y-1">
                {page.dialogue.map((d, i) => (
                  <div key={i} className="text-xs bg-tool-bg p-2 rounded-md">
                    <span className="font-semibold mr-1.5">{d.speaker}:</span>
                    {d.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-[11px] text-tool-ink-soft flex flex-wrap gap-x-3">
            <span>📍 {page.scene_state.location}</span>
            {page.scene_state.weather && <span>🌤 {page.scene_state.weather}</span>}
            {page.scene_state.time_of_day && <span>🕓 {page.scene_state.time_of_day}</span>}
          </div>

          {error && (
            <div className="text-[11px] text-tool-red bg-tool-red/10 px-2 py-1.5 rounded-md">
              ❌ {error}
            </div>
          )}

          <button
            onClick={onRender}
            disabled={rendering}
            className={`w-full mt-1 py-2 text-sm font-medium rounded-md transition flex items-center justify-center gap-1.5 ${
              imageUrl
                ? 'bg-tool-bg text-tool-ink hover:bg-tool-border/40 border border-tool-border'
                : 'bg-tool-accent text-white hover:opacity-90'
            } disabled:opacity-50`}
          >
            {rendering ? (
              <><Spinner /> 生成中…</>
            ) : imageUrl ? (
              '🎨 重新生成'
            ) : (
              '🎨 生成插画'
            )}
          </button>
        </div>
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
