import { CopilotRuntime, OpenAIAdapter, copilotRuntimeNextJSAppRouterEndpoint } from '@copilotkit/runtime';
import OpenAI from 'openai';
import { getOpenRouterConfig } from '@magicborn/ai/aiadapter/openrouter/config';

const config = getOpenRouterConfig();

if (!config.apiKey) {
  throw new Error('OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable.');
}

const runtime = new CopilotRuntime();

// Create OpenAI-compatible client for OpenRouter
const openaiClient = new OpenAI({
  apiKey: config.apiKey,
  baseURL: config.baseUrl,
});

// Create OpenAI adapter for CopilotKit
// Type assertion needed because OpenAI from 'openai' package is compatible but types differ slightly
const serviceAdapter = new OpenAIAdapter({
  openai: openaiClient as any,
  model: config.models.fast,
});

runtime.handleServiceAdapter(serviceAdapter);

const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  serviceAdapter,
  endpoint: '/api/copilotkit',
});

export async function POST(req: Request) {
  return handleRequest(req);
}
