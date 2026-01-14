import 'server-only';

const DEFAULT_MODEL_FAST = 'openai/gpt-4o-mini';
const DEFAULT_MODEL_REASONING = 'openai/o1-mini';
const DEFAULT_TIMEOUT_MS = 60000;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

const parseTimeout = (value?: string) => {
  if (!value) {
    return DEFAULT_TIMEOUT_MS;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }
  return parsed;
};

export type OpenRouterConfig = {
  apiKey?: string;
  baseUrl: string;
  timeoutMs: number;
  models: {
    fast: string;
    reasoning: string;
  };
};

export const getOpenRouterConfig = (): OpenRouterConfig => ({
  apiKey: process.env.OPENROUTER_API_KEY?.trim(),
  baseUrl: process.env.OPENROUTER_BASE_URL?.trim() || OPENROUTER_BASE_URL,
  timeoutMs: parseTimeout(process.env.OPENROUTER_TIMEOUT_MS),
  models: {
    fast: process.env.OPENROUTER_MODEL_FAST ?? DEFAULT_MODEL_FAST,
    reasoning: process.env.OPENROUTER_MODEL_REASONING ?? DEFAULT_MODEL_REASONING,
  },
});
