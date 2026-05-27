'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CharacterCard({
  id,
  name_cn,
  role,
  animal,
  hasRef,
  isProtagonist,
}: {
  id: string;
  name_cn: string;
  role: string;
  animal: string;
  hasRef: boolean;
  isProtagonist: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<'delete' | 'regen' | null>(null);
  const [refKey, setRefKey] = useState(0); // bust img cache after regen

  async function handleDelete() {
    if (isProtagonist) return;
    if (!confirm(`确认删除角色 "${name_cn}"？这会删 yaml + 定妆图,不可撤销。`)) return;
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
    if (hasRef && !confirm(`重新生成定妆图会覆盖当前 canonical "${name_cn}.png"。建议先去 iterations 备份。继续吗？`)) return;
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
    } catch (err) {
      alert(`重生失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="aspect-[3/4] bg-gray-100 relative">
        {hasRef ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/character-ref/${id}/?k=${refKey}`}
            alt={name_cn}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {animal.includes('兔') ? '🐰' : animal.includes('狐') ? '🦊' : animal.includes('羊') ? '🐑' : '🎭'}
          </div>
        )}
        {busy === 'regen' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm">
            🎨 生成中…（约 3 分钟）
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-baseline gap-2">
          <h3 className="font-semibold text-lg">{name_cn}</h3>
          {isProtagonist && (
            <span className="text-[10px] text-shuishui-pink bg-shuishui-pink-soft px-1.5 py-0.5 rounded-full">
              主角
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1 truncate">{role}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{animal}</p>
        <div className="flex gap-2 mt-3 text-sm">
          <Link
            href={`/characters/${id}`}
            className="flex-1 text-center bg-shuishui-pink-soft text-shuishui-pink px-3 py-2 rounded-lg font-medium hover:bg-shuishui-pink hover:text-white transition"
          >
            编辑
          </Link>
          <button
            onClick={handleRegen}
            disabled={busy !== null}
            className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition disabled:opacity-50"
            title="重新生成定妆图"
          >
            🎨
          </button>
          {!isProtagonist && (
            <button
              onClick={handleDelete}
              disabled={busy !== null}
              className="px-3 py-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
            >
              {busy === 'delete' ? '…' : '删除'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
