import { NextResponse } from 'next/server';

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL?.trim() || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL_FAST?.trim() || 'openai/gpt-4o-mini';

const SYSTEM_PROMPT = [
  'You are a theme design assistant for tweakcn/shadcn.',
  'Return concise JSON with keys: themeName, intent, tokens, rationale.',
  'tokens should include css variables where possible (color, radius, spacing).',
].join(' ');

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY is not configured.' },
      { status: 500 }
    );
  }

  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required.' }, { status: 400 });
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      return NextResponse.json(
        { error: 'OpenRouter request failed.', details },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'No AI response returned.' }, { status: 502 });
    }

    return NextResponse.json({ result: content });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'AI request failed.', details: message }, { status: 500 });
  }
}
