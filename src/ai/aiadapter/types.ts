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
