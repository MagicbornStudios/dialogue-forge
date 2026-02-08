import 'server-only';

const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_TIMEOUT_MS = 60000;

const FALLBACK_REFERER =
  process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';

const FALLBACK_TITLE = 'Dialogue Forge Studio';

function parseTimeoutMs(value: string | undefined): number {
  if (!value) {
    return DEFAULT_TIMEOUT_MS;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return parsed;
}

export type OpenRouterConfig = {
  apiKey?: string;
  baseUrl: string;
  timeoutMs: number;
  headers: Record<string, string>;
  models: {
    freeChainRaw?: string;
    fast?: string;
    reasoning?: string;
    default?: string;
  };
};

export function getOpenRouterConfig(): OpenRouterConfig {
  return {
    apiKey: process.env.OPENROUTER_API_KEY?.trim(),
    baseUrl: process.env.OPENROUTER_BASE_URL?.trim() || DEFAULT_OPENROUTER_BASE_URL,
    timeoutMs: parseTimeoutMs(process.env.OPENROUTER_TIMEOUT_MS),
    headers: {
      'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER?.trim() || FALLBACK_REFERER,
      'X-Title': process.env.OPENROUTER_X_TITLE?.trim() || FALLBACK_TITLE,
    },
    models: {
      freeChainRaw:
        process.env.OPENROUTER_THEME_MODELS_FREE?.trim() ||
        process.env.OPENROUTER_MODELS_FREE?.trim() ||
        process.env.OPENROUTER_FREE_MODELS?.trim() ||
        process.env.OPENROUTER_MODEL_CHAIN_FREE?.trim(),
      fast: process.env.OPENROUTER_MODEL_FAST?.trim(),
      reasoning: process.env.OPENROUTER_MODEL_REASONING?.trim(),
      default: process.env.AI_DEFAULT_MODEL?.trim(),
    },
  };
}

