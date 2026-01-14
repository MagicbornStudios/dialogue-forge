import 'server-only';

import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

import type {
  AiAdapter,
  AiEditProposal,
  AiPlan,
  AiPlanStepApplyResult,
  AiPlanStepProposal,
  AiResponse,
  AiStreamResponse,
} from '@/src/lib/aiadapter/types';
import { getOpenRouterConfig, type OpenRouterConfig } from './config';

const OPENROUTER_MODEL_MODE = {
  FAST: 'fast',
  REASONING: 'reasoning',
} as const;

const NOT_CONFIGURED_MESSAGE = 'AI adapter is not configured.';

type OpenRouterRole = 'system' | 'user' | 'assistant';

type OpenRouterMessage = {
  role: OpenRouterRole;
  content: string;
};

const errorResponse = (message: string, status?: number): AiResponse<never> => ({
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

const toHeadersInit = (headers: Headers) => Object.fromEntries(headers.entries());

const resolveModelFromPayload = (payload: unknown, config: OpenRouterConfig) => {
  if (payload && typeof payload === 'object') {
    const candidate = payload as {
      mode?: string;
      preference?: string;
      reasoning?: boolean;
    };
    if (candidate.reasoning === true) {
      return config.models.reasoning;
    }
    if (candidate.mode === OPENROUTER_MODEL_MODE.REASONING) {
      return config.models.reasoning;
    }
    if (candidate.preference === OPENROUTER_MODEL_MODE.REASONING) {
      return config.models.reasoning;
    }
  }
  return config.models.fast;
};

const buildChatMessages = (payload: unknown): OpenRouterMessage[] => {
  if (payload && typeof payload === 'object') {
    const candidate = payload as { messages?: OpenRouterMessage[] };
    if (Array.isArray(candidate.messages) && candidate.messages.length > 0) {
      return candidate.messages;
    }
  }
  return [
    {
      role: 'user',
      content: JSON.stringify(payload ?? {}),
    },
  ];
};

const parseContentJson = <T>(content: string): AiResponse<T> => {
  try {
    const parsed = JSON.parse(content) as T;
    return { ok: true, data: parsed };
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Unable to parse AI response.',
      502
    );
  }
};

const buildEditProposalMessages = (payload: unknown): OpenRouterMessage[] => [
  {
    role: 'system',
    content:
      'You are an expert editor. Use the provided context to propose edits (text, structured content, or graph data). Output JSON with { "patch": string, "summary": string }. "patch" must be a JSON string encoding an array of edit operations. Use ops with type values "replace_content", "splice_content", or "replace_blocks". Return ONLY JSON.',
  },
  {
    role: 'user',
    content: JSON.stringify(payload ?? {}),
  },
];

const buildPlanMessages = (payload: unknown): OpenRouterMessage[] => [
  {
    role: 'system',
    content:
      'You are a planning assistant. Output JSON with { "id": string, "title": string, "steps": [{ "id": string, "title": string, "description": string }] }. Return ONLY JSON.',
  },
  {
    role: 'user',
    content: JSON.stringify(payload ?? {}),
  },
];

const normalizeEditProposal = (
  content: string
): AiResponse<AiEditProposal> => {
  const parsed = parseContentJson<unknown>(content);
  if (!parsed.ok) {
    return parsed;
  }

  const proposal = parsed.data;
  if (Array.isArray(proposal)) {
    return {
      ok: true,
      data: {
        patch: JSON.stringify(proposal),
      },
    };
  }

  if (!proposal || typeof proposal !== 'object') {
    return errorResponse('AI response missing edit proposal.', 502);
  }

  const candidate = proposal as {
    patch?: unknown;
    summary?: unknown;
    ops?: unknown;
  };
  const summary = typeof candidate.summary === 'string' ? candidate.summary : undefined;

  if (typeof candidate.patch === 'string') {
    return { ok: true, data: { patch: candidate.patch, summary } };
  }

  if (Array.isArray(candidate.patch)) {
    return {
      ok: true,
      data: { patch: JSON.stringify(candidate.patch), summary },
    };
  }

  if (Array.isArray(candidate.ops)) {
    return {
      ok: true,
      data: { patch: JSON.stringify(candidate.ops), summary },
    };
  }

  return errorResponse('AI response missing patch data.', 502);
};

const createTimeoutSignal = (timeoutMs: number) =>
  timeoutMs > 0 ? AbortSignal.timeout(timeoutMs) : undefined;

export const createOpenRouterAdapter = (
  config: OpenRouterConfig = getOpenRouterConfig()
): AiAdapter => {
  if (!config.apiKey) {
    return {
      streamChat: async () => createSseErrorStream(NOT_CONFIGURED_MESSAGE, 501),
      proposeEdits: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
      createPlan: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
      proposePlanStep: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
      applyPlanStep: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
    };
  }

  const client = createOpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  });

  return {
    streamChat: async (payload: unknown): Promise<AiStreamResponse> => {
      try {
        const model = resolveModelFromPayload(payload, config);
        const messages = buildChatMessages(payload);
        const result = streamText({
          model: client(model),
          messages,
          abortSignal: createTimeoutSignal(config.timeoutMs),
        });
        const response = result.toDataStreamResponse();
        return {
          stream: response.body ?? new ReadableStream<Uint8Array>(),
          status: response.status,
          headers: toHeadersInit(response.headers),
        };
      } catch (error) {
        return createSseErrorStream(
          error instanceof Error
            ? error.message
            : 'OpenRouter streaming request failed.',
          502
        );
      }
    },
    proposeEdits: async (payload: unknown): Promise<AiResponse<AiEditProposal>> => {
      try {
        const result = await generateText({
          model: client(resolveModelFromPayload({
            ...(payload && typeof payload === 'object' ? payload : {}),
            reasoning: true,
          }, config)),
          messages: buildEditProposalMessages(payload),
          abortSignal: createTimeoutSignal(config.timeoutMs),
        });

        return normalizeEditProposal(result.text);
      } catch (error) {
        return errorResponse(
          error instanceof Error
            ? error.message
            : 'OpenRouter edit proposal request failed.',
          502
        );
      }
    },
    createPlan: async (payload: unknown): Promise<AiResponse<AiPlan>> => {
      try {
        const result = await generateText({
          model: client(resolveModelFromPayload({
            ...(payload && typeof payload === 'object' ? payload : {}),
            reasoning: true,
          }, config)),
          messages: buildPlanMessages(payload),
          abortSignal: createTimeoutSignal(config.timeoutMs),
        });

        return parseContentJson<AiPlan>(result.text);
      } catch (error) {
        return errorResponse(
          error instanceof Error ? error.message : 'OpenRouter plan request failed.',
          502
        );
      }
    },
    proposePlanStep: async (): Promise<AiResponse<AiPlanStepProposal>> =>
      errorResponse('Plan step proposals are not configured.', 501),
    applyPlanStep: async (): Promise<AiResponse<AiPlanStepApplyResult>> =>
      errorResponse('Plan step apply is not configured.', 501),
  };
};
