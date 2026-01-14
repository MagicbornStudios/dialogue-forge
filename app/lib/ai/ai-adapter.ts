export type AiError = {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
};

export type AiSuccessResponse<T> = {
  ok: true;
  data: T;
};

export type AiFailureResponse = {
  ok: false;
  error: AiError;
};

export type AiResponse<T> = AiSuccessResponse<T> | AiFailureResponse;

export type AiEditProposal = {
  patch: string;
  summary?: string;
};

export type AiPlanStep = {
  id: string;
  title: string;
  description?: string;
};

export type AiPlan = {
  id: string;
  title: string;
  steps: AiPlanStep[];
};

export type AiPlanStepProposal = {
  patch: string;
  summary?: string;
};

export type AiPlanStepApplyResult = {
  applied: boolean;
  message?: string;
  patch?: string;
};

export type AiStreamResponse = {
  stream: ReadableStream<Uint8Array>;
  status?: number;
  headers?: HeadersInit;
};

export type AiPlanStepRequest = {
  planId: string;
  stepId: string;
  payload: unknown;
};

export interface AiAdapter {
  streamChat: (payload: unknown) => Promise<AiStreamResponse>;
  proposeEdits: (payload: unknown) => Promise<AiResponse<AiEditProposal>>;
  createPlan: (payload: unknown) => Promise<AiResponse<AiPlan>>;
  proposePlanStep: (payload: AiPlanStepRequest) => Promise<AiResponse<AiPlanStepProposal>>;
  applyPlanStep?: (payload: AiPlanStepRequest) => Promise<AiResponse<AiPlanStepApplyResult>>;
}

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL_MODE = {
  FAST: 'fast',
  REASONING: 'reasoning',
} as const;
const OPENROUTER_MODEL_FAST =
  process.env.OPENROUTER_MODEL_FAST ?? 'openai/gpt-4o-mini';
const OPENROUTER_MODEL_REASONING =
  process.env.OPENROUTER_MODEL_REASONING ?? 'openai/o1-mini';

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

type OpenRouterRole = 'system' | 'user' | 'assistant';

type OpenRouterMessage = {
  role: OpenRouterRole;
  content: string;
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

const getOpenRouterKey = () => process.env.OPENROUTER_API_KEY?.trim();

const getOpenRouterHeaders = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
});

const resolveModelFromPayload = (payload: unknown) => {
  if (payload && typeof payload === 'object') {
    const candidate = payload as {
      mode?: string;
      preference?: string;
      reasoning?: boolean;
    };
    if (candidate.reasoning === true) {
      return OPENROUTER_MODEL_REASONING;
    }
    if (candidate.mode === OPENROUTER_MODEL_MODE.REASONING) {
      return OPENROUTER_MODEL_REASONING;
    }
    if (candidate.preference === OPENROUTER_MODEL_MODE.REASONING) {
      return OPENROUTER_MODEL_REASONING;
    }
  }
  return OPENROUTER_MODEL_FAST;
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
      error instanceof Error
        ? error.message
        : 'Unable to parse AI response.',
      502
    );
  }
};

const readOpenRouterContent = async <T>(
  response: Response
): Promise<AiResponse<T>> => {
  if (!response.ok) {
    const errorText = await response.text();
    return errorResponse(errorText || 'OpenRouter request failed.', response.status);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return errorResponse('OpenRouter response missing content.', 502);
  }
  return parseContentJson<T>(content);
};

const requestOpenRouter = async (
  apiKey: string,
  body: Record<string, unknown>
) => {
  return fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: getOpenRouterHeaders(apiKey),
    body: JSON.stringify(body),
  });
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

export const createAiChat = async (payload: unknown): Promise<AiStreamResponse> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    return createSseErrorStream(NOT_CONFIGURED_MESSAGE, 501);
  }

  const model = resolveModelFromPayload(payload);
  const messages = buildChatMessages(payload);
  const response = await requestOpenRouter(apiKey, {
    model,
    messages,
    stream: true,
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    return createSseErrorStream(
      errorText || 'OpenRouter streaming request failed.',
      response.status
    );
  }

  const contentType = response.headers.get('Content-Type');

  return {
    stream: response.body,
    status: response.status,
    headers: contentType ? { 'Content-Type': contentType } : undefined,
  };
};

export const createAiEditProposal = async (
  payload: unknown
): Promise<AiResponse<AiEditProposal>> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    return errorResponse(NOT_CONFIGURED_MESSAGE, 501);
  }

  const model = resolveModelFromPayload({
    ...(payload && typeof payload === 'object' ? payload : {}),
    reasoning: true,
  });
  const response = await requestOpenRouter(apiKey, {
    model,
    messages: buildEditProposalMessages(payload),
    stream: false,
  });

  const rawResponse = await readOpenRouterContent<unknown>(response);
  if (!rawResponse.ok) {
    return rawResponse;
  }

  const proposal = rawResponse.data;
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

export const createAiPlan = async (
  payload: unknown
): Promise<AiResponse<AiPlan>> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    return errorResponse(NOT_CONFIGURED_MESSAGE, 501);
  }

  const model = resolveModelFromPayload({
    ...(payload && typeof payload === 'object' ? payload : {}),
    reasoning: true,
  });
  const response = await requestOpenRouter(apiKey, {
    model,
    messages: buildPlanMessages(payload),
    stream: false,
  });

  return readOpenRouterContent<AiPlan>(response);
};

const defaultAdapter: AiAdapter = {
  streamChat: async () => createSseErrorStream(NOT_CONFIGURED_MESSAGE, 501),
  proposeEdits: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
  createPlan: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
  proposePlanStep: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
  applyPlanStep: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
};

const openRouterAdapter: AiAdapter = {
  streamChat: (payload) => createAiChat(payload),
  proposeEdits: (payload) => createAiEditProposal(payload),
  createPlan: (payload) => createAiPlan(payload),
  proposePlanStep: async () =>
    errorResponse('Plan step proposals are not configured.', 501),
  applyPlanStep: async () =>
    errorResponse('Plan step apply is not configured.', 501),
};

export const isServerSideApplyEnabled = () =>
  process.env.AI_SERVER_APPLY_ENABLED === 'true';

export const getAiAdapter = (): AiAdapter =>
  getOpenRouterKey() ? openRouterAdapter : defaultAdapter;
