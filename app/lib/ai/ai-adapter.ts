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

const defaultAdapter: AiAdapter = {
  streamChat: async () => createSseErrorStream(NOT_CONFIGURED_MESSAGE, 501),
  proposeEdits: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
  createPlan: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
  proposePlanStep: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
  applyPlanStep: async () => errorResponse(NOT_CONFIGURED_MESSAGE, 501),
};

export const isServerSideApplyEnabled = () =>
  process.env.AI_SERVER_APPLY_ENABLED === 'true';

export const getAiAdapter = (): AiAdapter => defaultAdapter;
