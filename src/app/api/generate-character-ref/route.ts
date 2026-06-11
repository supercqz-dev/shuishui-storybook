import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getClient, IMAGE_MODEL } from '@/lib/openai-client';
import { loadCharacters, loadStyle } from '@/lib/bible';
import { buildCharacterRefPrompt } from '@/lib/prompt-templates';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const REF_DIR = path.join(process.cwd(), 'assets', 'bible', 'character_refs');

type Body = {
  character_id: string;
  overwrite?: boolean;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body.character_id) {
      return NextResponse.json(
        { error: 'character_id 必填' },
        { status: 400 },
      );
    }

    const [characters, style] = await Promise.all([
      loadCharacters(),
      loadStyle(),
    ]);
    const character = characters.find((c) => c.id === body.character_id);
    if (!character) {
      return NextResponse.json(
        { error: `character '${body.character_id}' 不存在` },
        { status: 404 },
      );
    }

    await fs.mkdir(REF_DIR, { recursive: true });
    const outPath = path.join(REF_DIR, `${character.id}.png`);

    if (!body.overwrite) {
      try {
        await fs.access(outPath);
        return NextResponse.json(
          { error: `${character.id}.png 已存在，传 overwrite:true 才能覆盖` },
          { status: 409 },
        );
      } catch {
        // file doesn't exist, continue
      }
    }

    const prompt = buildCharacterRefPrompt({ character, style });
    await fs.writeFile(`/tmp/last-charref-prompt-${character.id}.txt`, prompt);
    const client = getClient();
    let result;
    try {
      result = await client.images.generate({
        model: IMAGE_MODEL,
        prompt,
        size: '1024x1536',
        quality: 'high',
        n: 1,
      } as unknown as Parameters<typeof client.images.generate>[0]);
    } catch (e) {
      const err = e as { status?: number; message?: string; error?: unknown };
      console.error(`[generate-character-ref] gateway rejected for ${character.id}. status=${err.status} message=${err.message}`);
      console.error(`[generate-character-ref] error body:`, JSON.stringify(err.error));
      return NextResponse.json(
        {
          error: err.message || 'image API failed',
          status: err.status,
          gateway_error: err.error,
          prompt_preview: prompt.slice(0, 500),
        },
        { status: 502 },
      );
    }

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json(
        { error: 'image API returned no b64_json' },
        { status: 502 },
      );
    }

    await fs.writeFile(outPath, Buffer.from(b64, 'base64'));
    return NextResponse.json({
      character_id: character.id,
      saved_to: outPath,
      relative: `assets/bible/character_refs/${character.id}.png`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[generate-character-ref] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
