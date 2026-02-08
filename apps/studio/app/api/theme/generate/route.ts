import { NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import {
  themeStylesSchema,
  mergeThemeStylesWithDefaults,
  type ThemeStyles,
} from '@magicborn/theme';
import {
  InvalidOpenRouterModelChainError,
  isFreeModelId,
  MissingOpenRouterApiKeyError,
  resolvePrimaryAndFallbacks,
} from '@/lib/model-router/server-state';
import { createFetchWithModelFallbacks } from '@/lib/model-router/openrouter-fetch';

const requestSchema = z.object({
  prompt: z.string().trim().min(1),
  currentStyles: themeStylesSchema,
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1),
      })
    )
    .optional(),
});

const responseSchema = z.object({
  assistantText: z.string().trim().min(1),
  themeStyles: themeStylesSchema,
});

const modelResponseSchema = z.object({
  assistantText: z.string(),
  themeStyles: z.unknown(),
});

const generateObjectUnsafe = generateObject as unknown as (args: unknown) => Promise<{
  object: unknown;
  response: { modelId?: string };
}>;

const SYSTEM_PROMPT = [
  'You are a theme assistant for shadcn/ui token generation.',
  'Respond only as valid JSON with keys assistantText and themeStyles.',
  'themeStyles must include both light and dark modes and all required tokens.',
  'Use valid CSS token values and keep contrast readable.',
  'Do not include markdown, code fences, or extra keys.',
].join(' ');

function buildUserPrompt(prompt: string, currentStyles: ThemeStyles): string {
  return [
    'Current theme styles JSON:',
    JSON.stringify(currentStyles),
    '',
    'User request:',
    prompt,
    '',
    'Return a full updated themeStyles object and a concise assistantText summary.',
  ].join('\n');
}

function validateThemeModelResponse(value: unknown): z.infer<typeof responseSchema> {
  const validated = responseSchema.safeParse(value);
  if (!validated.success) {
    const details = validated.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Model response failed validation: ${details}`);
  }

  return validated.data;
}

export async function POST(request: Request) {
  let body: z.infer<typeof requestSchema>;

  try {
    body = requestSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Invalid request body.',
        code: 'INVALID_REQUEST',
        details: error instanceof Error ? error.message : 'Unknown validation error',
      },
      { status: 400 }
    );
  }

  let routerState: ReturnType<typeof resolvePrimaryAndFallbacks>;
  try {
    routerState = resolvePrimaryAndFallbacks();
  } catch (error) {
    if (error instanceof MissingOpenRouterApiKeyError) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'MISSING_OPENROUTER_API_KEY',
        },
        { status: 500 }
      );
    }

    if (error instanceof InvalidOpenRouterModelChainError) {
      return NextResponse.json(
        {
          error: error.message,
          code: 'INVALID_FREE_MODEL_CHAIN',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to resolve OpenRouter free model config.',
        code: 'MODEL_CONFIG_ERROR',
      },
      { status: 500 }
    );
  }

  const requestedModelRaw = (
    request.headers.get('x-theme-model') ?? request.headers.get('x-forge-model')
  )?.trim();
  const requestedModel =
    requestedModelRaw && requestedModelRaw !== 'auto' ? requestedModelRaw : null;

  if (requestedModel && !isFreeModelId(requestedModel)) {
    return NextResponse.json(
      {
        error: `Model "${requestedModel}" is not allowed. Theme generation accepts only :free models.`,
        code: 'MODEL_NOT_FREE',
      },
      { status: 400 }
    );
  }

  const selectedPrimary = requestedModel ?? routerState.primary;
  const selectedFallbacks = requestedModel ? [] : routerState.fallbacks;

  const customFetch =
    selectedFallbacks.length > 0
      ? createFetchWithModelFallbacks(
          selectedPrimary,
          selectedFallbacks,
          routerState.config.baseUrl
        )
      : undefined;

  const openai = createOpenAI({
    apiKey: routerState.config.apiKey,
    baseURL: routerState.config.baseUrl,
    headers: routerState.config.headers,
    fetch: customFetch,
  });

  try {
    const { object, response } = await generateObjectUnsafe({
      model: openai(selectedPrimary),
      schema: modelResponseSchema,
      temperature: 0.35,
      maxOutputTokens: 2200,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        ...(body.history ?? []).map((entry) => ({
          role: entry.role,
          content: entry.content,
        })),
        {
          role: 'user',
          content: buildUserPrompt(body.prompt, body.currentStyles),
        },
      ],
      abortSignal: AbortSignal.timeout(routerState.config.timeoutMs),
    });

    const parsed = validateThemeModelResponse(object);

    return NextResponse.json({
      assistantText: parsed.assistantText,
      themeStyles: mergeThemeStylesWithDefaults(parsed.themeStyles),
      modelUsed: response.modelId ?? selectedPrimary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();

    if (
      lower.includes('schema') ||
      lower.includes('validation') ||
      lower.includes('json') ||
      lower.includes('no object generated')
    ) {
      return NextResponse.json(
        {
          error: 'Free model routing returned output that did not match theme schema.',
          code: 'INVALID_MODEL_OUTPUT',
          details: message,
          chain: [selectedPrimary, ...selectedFallbacks],
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: 'OpenRouter free model chain exhausted.',
        code: 'OPENROUTER_FALLBACK_EXHAUSTED',
        details: message,
        chain: [selectedPrimary, ...selectedFallbacks],
      },
      { status: 502 }
    );
  }
}
