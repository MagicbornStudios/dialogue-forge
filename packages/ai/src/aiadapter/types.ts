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

export type AiImageGenerationRequest = {
  prompt: string;
  model?: string;
  size?: string;
  n?: number;
  response_format?: 'url' | 'b64_json';
  quality?: string;
  style?: string;
  seed?: number;
  user?: string;
};

export type AiImageGenerationResult = {
  created?: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
  model?: string;
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
  generateImage: (
    payload: AiImageGenerationRequest
  ) => Promise<AiResponse<AiImageGenerationResult>>;
}
