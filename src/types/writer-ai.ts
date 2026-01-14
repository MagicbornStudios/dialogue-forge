export type WriterScope = {
  projectId?: number;
  actId?: number;
  chapterId?: number;
  pageId?: number;
  docId?: number;
  docKind?: string;
  locale?: string;
  metadata?: Record<string, unknown>;
};

export type WriterSnapshot = {
  id: string;
  scope: WriterScope;
  title?: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  revisionId?: string;
  metadata?: Record<string, unknown>;
};

export type WriterSelection = {
  scope: WriterScope;
  anchorOffset: number;
  focusOffset: number;
  selectedText?: string;
  path?: Array<string | number>;
};

export type WriterPatchOp = {
  op: string;
  path: string;
  value?: unknown;
  from?: string;
};

export type WriterPatchProposal = {
  id: string;
  scope: WriterScope;
  ops: WriterPatchOp[];
  summary?: string;
  rationale?: string;
  selection?: WriterSelection;
};

export type WriterPlanStep = {
  id: string;
  description: string;
  status?: string;
  metadata?: Record<string, unknown>;
};

export type WriterPlan = {
  id: string;
  scope: WriterScope;
  summary: string;
  steps: WriterPlanStep[];
  metadata?: Record<string, unknown>;
};
