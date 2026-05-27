'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import YAML from 'yaml';

type Mode = 'new' | 'edit';

export default function CharacterForm({ mode, characterId }: { mode: Mode; characterId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [id, setId] = useState('');
  const [nameCn, setNameCn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [role, setRole] = useState('');
  const [animal, setAnimal] = useState('');
  const [promptAnchor, setPromptAnchor] = useState('');
  const [extraYaml, setExtraYaml] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (mode !== 'edit' || !characterId) return;
    fetch(`/api/character/${characterId}/`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
        const c = d.character as Record<string, unknown>;
        setId(String(c.id || ''));
        setNameCn(String(c.name_cn || ''));
        setNameEn(String(c.name_en || ''));
        setRole(String(c.role || ''));
        setAnimal(String(c.animal || ''));
        setPromptAnchor(String(c.prompt_anchor || ''));
        // Extract everything else into a YAML extra block
        const known = new Set(['id', 'name_cn', 'name_en', 'role', 'animal', 'prompt_anchor']);
        const extras: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(c)) if (!known.has(k)) extras[k] = v;
        setExtraYaml(Object.keys(extras).length > 0 ? YAML.stringify(extras) : '');
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [mode, characterId]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      let extras: Record<string, unknown> = {};
      if (extraYaml.trim()) {
        try {
          extras = YAML.parse(extraYaml) as Record<string, unknown>;
          if (typeof extras !== 'object' || Array.isArray(extras)) {
            throw new Error('额外 YAML 必须是对象');
          }
        } catch (e) {
          throw new Error(`额外 YAML 解析失败: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      const body = {
        id: id.trim(),
        name_cn: nameCn.trim(),
        name_en: nameEn.trim() || undefined,
        role: role.trim() || undefined,
        animal: animal.trim() || undefined,
        prompt_anchor: promptAnchor.trim(),
        ...extras,
      };
      const res = await fetch('/api/character/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      router.push('/characters');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-gray-400">加载中…</div>;
  }

  return (
    <main className="tool-app min-h-screen bg-tool-bg text-tool-ink">
      <div className="max-w-2xl mx-auto px-6 py-10 pb-32">
        <Link href="/characters" className="text-sm text-tool-ink-soft hover:text-tool-ink">← 返回角色管理</Link>
        <h1 className="text-3xl font-bold mt-2">
          {mode === 'new' ? '新增角色' : `编辑 ${nameCn || id}`}
        </h1>
        <p className="text-sm text-tool-ink-soft mt-1">
          必填:id、中文名、prompt anchor(图像生成的核心描述)
        </p>

        {error && (
          <div className="mt-6 p-3 bg-tool-red/10 border border-tool-red/30 rounded-lg text-tool-red text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-5">
        <Field label="ID" hint="只能用小写字母/数字/-。提交后不要随便改(关联文件名)">
          <input
            className="w-full mt-2 p-3 rounded-lg border border-tool-border focus:border-tool-accent focus:ring-1 focus:ring-tool-accent focus:outline-none bg-tool-card text-sm font-mono text-sm"
            value={id}
            onChange={(e) => setId(e.target.value)}
            disabled={mode === 'edit'}
            placeholder="papa / mama / xiaoming"
          />
        </Field>

        <Field label="中文名" hint="UI 显示用">
          <input
            className="w-full mt-2 p-3 rounded-lg border border-tool-border focus:border-tool-accent focus:ring-1 focus:ring-tool-accent focus:outline-none bg-tool-card text-sm"
            value={nameCn}
            onChange={(e) => setNameCn(e.target.value)}
            placeholder="爸爸 / 妈妈 / 小明"
          />
        </Field>

        <Field label="英文名 (可选)">
          <input
            className="w-full mt-2 p-3 rounded-lg border border-tool-border focus:border-tool-accent focus:ring-1 focus:ring-tool-accent focus:outline-none bg-tool-card text-sm"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="Papa / Mama"
          />
        </Field>

        <Field label="角色身份 (可选)" hint="用在故事生成的系统 prompt 里">
          <input
            className="w-full mt-2 p-3 rounded-lg border border-tool-border focus:border-tool-accent focus:ring-1 focus:ring-tool-accent focus:outline-none bg-tool-card text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="水水的爸爸 / 水水的同学"
          />
        </Field>

        <Field label="动物种类 (可选)" hint="用在故事生成里(LLM 不直接吃 prompt anchor)">
          <input
            className="w-full mt-2 p-3 rounded-lg border border-tool-border focus:border-tool-accent focus:ring-1 focus:ring-tool-accent focus:outline-none bg-tool-card text-sm"
            value={animal}
            onChange={(e) => setAnimal(e.target.value)}
            placeholder="红狐狸 / 灰色兔子"
          />
        </Field>

        <Field
          label="🎨 Prompt Anchor (核心)"
          hint="给图像模型的描述。中文/英文都行。决定每页里这个角色的样子。改这条会影响所有未来生成的图。"
        >
          <textarea
            className="w-full mt-2 p-3 rounded-lg border border-tool-border focus:border-tool-accent focus:ring-1 focus:ring-tool-accent focus:outline-none bg-tool-card text-sm min-h-[180px] resize-y font-mono text-sm leading-relaxed"
            value={promptAnchor}
            onChange={(e) => setPromptAnchor(e.target.value)}
            placeholder="可爱的拟人化兔子,采用高级动画电影级CGI风格,..."
          />
        </Field>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs text-tool-ink-soft underline-offset-2 hover:underline"
          >
            {showAdvanced ? '收起' : '展开'}高级 (其他 yaml 字段)
          </button>
          {showAdvanced && (
            <Field
              label="其他字段 (YAML)"
              hint="性格 / 喜好 / story_seeds 等。yaml 对象格式。留空就只存上面 6 个核心字段"
            >
              <textarea
                className="w-full mt-2 p-3 rounded-lg border border-tool-border focus:border-tool-accent focus:ring-1 focus:ring-tool-accent focus:outline-none bg-tool-card text-sm min-h-[200px] resize-y font-mono text-xs"
                value={extraYaml}
                onChange={(e) => setExtraYaml(e.target.value)}
                placeholder={'personality:\n  core: 开朗\n  traits:\n    - 爱笑\n    - 体贴'}
              />
            </Field>
          )}
        </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-tool-card/95 backdrop-blur border-t border-tool-border">
        <div className="max-w-2xl mx-auto px-6 py-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-tool-accent text-white font-semibold py-3 rounded-lg hover:opacity-90 active:scale-[0.99] transition disabled:opacity-60"
          >
            {saving ? '保存中…' : mode === 'new' ? '创建角色' : '保存修改'}
          </button>
        </div>
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
      <label className="block font-semibold text-sm text-tool-ink">{label}</label>
      {hint && <div className="text-xs text-tool-ink-soft mt-0.5">{hint}</div>}
      {children}
    </div>
  );
}
