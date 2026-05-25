import { NextResponse } from 'next/server';
import { getClient, LLM_MODEL } from '@/lib/openai-client';
import { loadCharacters, loadWorld } from '@/lib/bible';
import {
  buildStorySystemPrompt,
  buildStoryUserPrompt,
} from '@/lib/prompt-templates';
import { STORY_JSON_SCHEMA } from '@/lib/story-schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type Body = {
  trigger: string;
  education_goal: string;
  characters_in_book?: string[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body.trigger?.trim() || !body.education_goal?.trim()) {
      return NextResponse.json(
        { error: 'trigger 和 education_goal 都必填' },
        { status: 400 },
      );
    }

    const characters_in_book =
      body.characters_in_book && body.characters_in_book.length > 0
        ? body.characters_in_book
        : ['shuishui'];

    const [characters, world] = await Promise.all([
      loadCharacters(),
      loadWorld(),
    ]);

    const reqCtx = {
      trigger: body.trigger,
      education_goal: body.education_goal,
      characters_in_book,
      characters,
      world,
    };

    const client = getClient();
    const completion = await client.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: buildStorySystemPrompt(reqCtx) },
        { role: 'user', content: buildStoryUserPrompt(reqCtx) },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: STORY_JSON_SCHEMA,
      },
      max_completion_tokens: 8000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        {
          error: 'LLM 返回空',
          finish_reason: completion.choices[0]?.finish_reason,
          usage: completion.usage,
        },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(content);
    return NextResponse.json({
      story: parsed,
      usage: completion.usage,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[generate-story] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
