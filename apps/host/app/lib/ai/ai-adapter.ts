import 'server-only';

import { createOpenRouterAdapter } from './aiadapter/openrouter/openrouter-adapter';
import { getOpenRouterConfig } from '@magicborn/ai/aiadapter/openrouter/config';
import type {
  AiAdapter,
  AiFailureResponse,
  AiResponse,
  AiStreamResponse,
} from '@magicborn/ai/aiadapter/types';

export type {
  AiAdapter,
  AiEditProposal,
  AiError,
  AiFailureResponse,
  AiImageGenerationRequest,
  AiImageGenerationResult,
  AiPlan,
  AiPlanStep,
  AiPlanStepApplyResult,
  AiPlanStepProposal,
  AiPlanStepRequest,
  AiResponse,
  AiStreamResponse,
  AiSuccessResponse,
} from '@magicborn/ai/aiadapter/types';

const DEFAULT_STREAM_HEADERS: HeadersInit = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
};

const NOT_CONFIGURED_MESSAGE = 'AI adapter is not configured.';

const errorResponse = (message: string, status?: number): AiFailureResponse => ({
  ok: false,
  error: {
    message,
    status,
  },
});

const encodeSse = (payload: unknown) => {
  const data = JSON.stringify(payload);
  return `data: ${data}\n\n`;
};

const createSseErrorStream = (message: string, status?: number): AiStreamResponse => {
  const encoder = new TextEncoder();
  const payload = errorResponse(message, status);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(encodeSse(payload)));
      controller.close();
    },
  });
  return {
    stream,
    status: status ?? 500,
  };
};

export const jsonResponse = <T>(response: AiResponse<T>, init: ResponseInit = {}) => {
  const status = response.ok ? 200 : response.error.status ?? 500;
  return Response.json(response, { ...init, status });
};

export const streamResponse = (response: AiStreamResponse) => {
  const headers = {
    ...DEFAULT_STREAM_HEADERS,
    ...(response.headers ?? {}),
  };
  return new Response(response.stream, { status: response.status ?? 200, headers });
};

const defaultAdapter: AiAdapter = {
  streamChat: async () => createSseErrorStream(NOT_CONFIGURED_MESSAGE, 501),
  proposeEdits: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
  createPlan: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
  proposePlanStep: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
  applyPlanStep: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
  generateImage: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
};

export const isServerSideApplyEnabled = () =>
  process.env.AI_SERVER_APPLY_ENABLED === 'true';

export const getAiAdapter = (): AiAdapter => {
  const config = getOpenRouterConfig();
  if (config.apiKey) {
    return createOpenRouterAdapter(config);
  }
  return defaultAdapter;
};
