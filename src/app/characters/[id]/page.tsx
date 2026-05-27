import CharacterForm from '@/components/CharacterForm';
import { loadCharacters } from '@/lib/bible';

// 静态导出需要列出所有可能的 id
export async function generateStaticParams() {
  const chars = await loadCharacters();
  return chars.map((c) => ({ id: c.id }));
}

export default async function EditCharacter({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CharacterForm mode="edit" characterId={id} />;
}
