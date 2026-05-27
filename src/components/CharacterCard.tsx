'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CharacterCard({
  id,
  name_cn,
  role,
  animal,
  hasRef,
  refMtime,
  isProtagonist,
}: {
  id: string;
  name_cn: string;
  role: string;
  animal: string;
  hasRef: boolean;
  refMtime?: number;
  isProtagonist: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<'delete' | 'regen' | null>(null);
  const [refKey, setRefKey] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (busy !== 'regen') return;
    setElapsed(0);
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [busy]);

  async function handleDelete() {
    if (isProtagonist) return;
    if (!confirm(`确认删除角色"${name_cn}"?这会删 yaml + 定妆图。`)) return;
    setBusy('delete');
    try {
      const res = await fetch(`/api/character/${id}/`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      router.refresh();
    } catch (err) {
      alert(`删除失败: ${err instanceof Error ? err.message : String(err)}`);
      setBusy(null);
    }
  }

  async function handleRegen() {
    if (busy) return;
    if (hasRef && !confirm(`重新生成定妆图会覆盖当前 ${name_cn}.png。建议先去 iterations 备份。继续?`)) return;
    setBusy('regen');
    try {
      const res = await fetch('/api/generate-character-ref/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ character_id: id, overwrite: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setRefKey((k) => k + 1);
      router.refresh();
    } catch (err) {
      alert(`重生失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }

  const updatedAgo = refMtime ? formatAgo(refMtime) : null;

  return (
    <div className="bg-tool-card rounded-xl border border-tool-border shadow-card overflow-hidden">
      <div className="aspect-[3/4] bg-tool-bg relative overflow-hidden">
        {hasRef ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/character-ref/${id}/?k=${refKey}`}
            alt={name_cn}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {iconFor(animal)}
          </div>
        )}
        {busy === 'regen' && (
          <div className="absolute inset-0 bg-tool-ink/70 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
            <Spinner size={20} />
            <div className="text-white text-xs">绘制中…</div>
            <div className="text-white/70 text-[10px] tabular-nums">
              {elapsed}s / ~180s
            </div>
          </div>
        )}
        {isProtagonist && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold text-tool-accent bg-tool-card px-2 py-0.5 rounded-full shadow-card">
            主角
          </span>
        )}
      </div>
      <div className="p-3.5">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold text-base">{name_cn}</h3>
          <span className="text-[10px] text-tool-ink-soft font-mono">{id}</span>
        </div>
        <p className="text-xs text-tool-ink-soft mt-0.5 truncate">{role || animal || '—'}</p>
        {updatedAgo && (
          <p className="text-[10px] text-tool-ink-soft/70 mt-0.5">
            定妆 {updatedAgo}
          </p>
        )}
        <div className="flex gap-1.5 mt-3 text-xs">
          <Link
            href={`/characters/${id}`}
            className="flex-1 text-center bg-tool-bg text-tool-ink px-2 py-1.5 rounded-md font-medium hover:bg-tool-border/50 border border-tool-border transition"
          >
            编辑
          </Link>
          <button
            onClick={handleRegen}
            disabled={busy !== null}
            title="重新生成定妆图"
            className="px-2.5 py-1.5 rounded-md bg-tool-bg text-tool-ink hover:bg-tool-purple/10 hover:text-tool-purple border border-tool-border transition disabled:opacity-50"
          >
            🎨
          </button>
          {!isProtagonist && (
            <button
              onClick={handleDelete}
              disabled={busy !== null}
              className="px-2.5 py-1.5 rounded-md bg-tool-bg text-tool-ink-soft hover:bg-tool-red/10 hover:text-tool-red border border-tool-border transition disabled:opacity-50"
            >
              {busy === 'delete' ? '…' : '删'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function iconFor(animal: string): string {
  if (animal.includes('兔')) return '🐰';
  if (animal.includes('狐')) return '🦊';
  if (animal.includes('羊')) return '🐑';
  if (animal.includes('猫')) return '🐱';
  if (animal.includes('狗')) return '🐶';
  if (animal.includes('熊')) return '🐻';
  return '🎭';
}

function formatAgo(mtimeMs: number): string {
  const diff = Date.now() - mtimeMs;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  return `${day} 天前`;
}

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin text-white">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
