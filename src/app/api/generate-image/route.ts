import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getClient, IMAGE_MODEL } from '@/lib/openai-client';
import { loadCharacters, loadStyle } from '@/lib/bible';
import { buildImagePrompt } from '@/lib/prompt-templates';
import type { Page } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type Body = {
  page: Page;
  book_id: string;
};

const IMAGE_SIZE = '1024x1536';
const IMAGE_QUALITY = 'high';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body.page || !body.book_id) {
      return NextResponse.json(
        { error: 'page 和 book_id 都必填' },
        { status: 400 },
      );
    }
    const safeBookId = body.book_id.replace(/[^a-z0-9-]/gi, '-');

    const [style, characters] = await Promise.all([
      loadStyle(),
      loadCharacters(),
    ]);

    const prompt = buildImagePrompt({
      page: body.page,
      style,
      characters,
    });

    const client = getClient();
    console.log(`[generate-image] page=${body.page.page} prompt_len=${prompt.length} chars`);
    await fs.writeFile('/tmp/last-image-prompt.txt', prompt);
    console.log(`[generate-image] full prompt dumped to /tmp/last-image-prompt.txt`);

    let result;
    try {
      result = await client.images.generate({
        model: IMAGE_MODEL,
        prompt,
        size: IMAGE_SIZE,
        quality: IMAGE_QUALITY,
        n: 1,
      } as Parameters<typeof client.images.generate>[0]);
    } catch (e) {
      const err = e as { status?: number; message?: string; error?: unknown };
      console.error(`[generate-image] gateway rejected. status=${err.status} message=${err.message}`);
      console.error(`[generate-image] error body:`, JSON.stringify(err.error));
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
        { error: 'image API returned no b64_json', detail: result },
        { status: 502 },
      );
    }

    const outDir = path.join(process.cwd(), 'public', 'generated', safeBookId);
    await fs.mkdir(outDir, { recursive: true });
    const filename = `page-${String(body.page.page).padStart(2, '0')}.png`;
    const outPath = path.join(outDir, filename);
    await fs.writeFile(outPath, Buffer.from(b64, 'base64'));

    const publicPath = `/generated/${safeBookId}/${filename}`;
    return NextResponse.json({
      image_path: publicPath,
      mode: 'generate',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[generate-image] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
