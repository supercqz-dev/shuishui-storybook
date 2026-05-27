import CharacterForm from '@/components/CharacterForm';

export default async function EditCharacter({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CharacterForm mode="edit" characterId={id} />;
}
