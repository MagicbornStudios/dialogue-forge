import { NextResponse } from 'next/server';
import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime';
import { BuiltInAgent } from '@copilotkit/runtime/v2';
import { createOpenAI } from '@ai-sdk/openai';
import OpenAI from 'openai';
import {
  InvalidOpenRouterModelChainError,
  isFreeModelId,
  MissingOpenRouterApiKeyError,
  resolvePrimaryAndFallbacks,
} from '@/lib/model-router/server-state';
import { createFetchWithModelFallbacks } from '@/lib/model-router/openrouter-fetch';

function resolveRequestedModel(req: Request): string | null {
  const requested = req.headers.get('x-forge-model') ?? req.headers.get('x-theme-model');
  if (!requested) {
    return null;
  }

  const model = requested.trim();
  if (!model || model === 'auto') {
    return null;
  }

  return model;
}

function buildRuntime(
  config: ReturnType<typeof resolvePrimaryAndFallbacks>['config'],
  primary: string,
  fallbacks: string[]
) {
  const customFetch =
    fallbacks.length > 0
      ? createFetchWithModelFallbacks(primary, fallbacks, config.baseUrl)
      : undefined;

  const openaiClient = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    fetch: customFetch,
    defaultHeaders: config.headers,
  });

  const serviceAdapter = new OpenAIAdapter({
    model: primary,
    openai: openaiClient as any,
  });

  const openRouterAiSdk = createOpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    headers: config.headers,
  });
  const languageModel = openRouterAiSdk(primary);
  const defaultAgent = new BuiltInAgent({ model: languageModel as any });

  const runtime = new CopilotRuntime({
    agents: { default: defaultAgent } as any,
  });

  return {
    runtime,
    serviceAdapter,
  };
}

export const POST = async (req: Request) => {
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

  const requestedModel = resolveRequestedModel(req);
  if (requestedModel && !isFreeModelId(requestedModel)) {
    return NextResponse.json(
      {
        error: `Model "${requestedModel}" is not allowed. /api/copilotkit accepts only :free models.`,
        code: 'MODEL_NOT_FREE',
      },
      { status: 400 }
    );
  }

  const selectedPrimary = requestedModel ?? routerState.primary;
  const selectedFallbacks = requestedModel ? [] : routerState.fallbacks;

  console.log(
    `[CopilotKit] Using model: ${selectedPrimary} (mode: ${routerState.mode}, fallbacks: ${selectedFallbacks.length})`
  );

  try {
    const { runtime, serviceAdapter } = buildRuntime(
      routerState.config,
      selectedPrimary,
      selectedFallbacks
    );

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: '/api/copilotkit',
    });

    return handleRequest(req);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Copilot runtime failed.',
        code: 'COPILOT_RUNTIME_ERROR',
      },
      { status: 500 }
    );
  }
};
