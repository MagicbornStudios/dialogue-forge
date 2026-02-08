import 'server-only';
import { getOpenRouterConfig, type OpenRouterConfig } from '@/lib/openrouter-config';

export class MissingOpenRouterApiKeyError extends Error {
  constructor() {
    super('OPENROUTER_API_KEY is not configured.');
    this.name = 'MissingOpenRouterApiKeyError';
  }
}

export class InvalidOpenRouterModelChainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOpenRouterModelChainError';
  }
}

export type FreeModelRouterState = {
  config: OpenRouterConfig & { apiKey: string };
  mode: 'free-only';
  primary: string;
  fallbacks: string[];
  chain: [string, ...string[]];
};

function splitCommaList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  const values: string[] = [];
  for (const token of value.split(',')) {
    const next = token.trim();
    if (next) {
      values.push(next);
    }
  }

  return values;
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }

  return result;
}

export function isFreeModelId(modelId: string): boolean {
  return modelId.endsWith(':free');
}

export function resolvePrimaryAndFallbacks(): FreeModelRouterState {
  const config = getOpenRouterConfig();
  const apiKey = config.apiKey?.trim();

  if (!apiKey) {
    throw new MissingOpenRouterApiKeyError();
  }

  const explicitChain = splitCommaList(config.models.freeChainRaw);
  const explicitNonFree = explicitChain.filter((model) => !isFreeModelId(model));

  if (explicitNonFree.length > 0) {
    throw new InvalidOpenRouterModelChainError(
      `Free model chain contains non-free models: ${explicitNonFree.join(', ')}.`
    );
  }

  const inferredFree = [
    config.models.fast,
    config.models.reasoning,
    config.models.default,
  ].filter((model): model is string => Boolean(model && isFreeModelId(model)));

  const chain = dedupe([...explicitChain, ...inferredFree]);

  if (chain.length === 0) {
    throw new InvalidOpenRouterModelChainError(
      [
        'No free OpenRouter model chain could be resolved.',
        'Set OPENROUTER_THEME_MODELS_FREE (preferred) or provide at least one :free model via OPENROUTER_MODEL_FAST/AI_DEFAULT_MODEL.',
      ].join(' ')
    );
  }

  const resolvedChain = chain as [string, ...string[]];

  return {
    config: {
      ...config,
      apiKey,
    },
    mode: 'free-only',
    primary: resolvedChain[0],
    fallbacks: resolvedChain.slice(1),
    chain: resolvedChain,
  };
}
