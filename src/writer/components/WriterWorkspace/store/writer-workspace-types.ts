import type { ForgeAct, ForgeChapter, ForgePage } from '@/forge/types/narrative';

export const WRITER_SAVE_STATUS = {
  DIRTY: 'dirty',
  SAVING: 'saving',
  SAVED: 'saved',
  ERROR: 'error',
} as const;

export type WriterSaveStatus =
  (typeof WRITER_SAVE_STATUS)[keyof typeof WRITER_SAVE_STATUS];

export type WriterDraftState = {
  title: string;
  content: string;
  status: WriterSaveStatus;
  error: string | null;
  revision: number;
};

export const WRITER_AI_PROPOSAL_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
} as const;

export type WriterAiProposalStatus =
  (typeof WRITER_AI_PROPOSAL_STATUS)[keyof typeof WRITER_AI_PROPOSAL_STATUS];

export type WriterAiPreviewMeta = {
  summary: string;
  rationale: string;
  risk: string;
};

// Forward declaration for WriterWorkspaceState to break circular dependency
export interface WriterWorkspaceState {
  acts: ForgeAct[];
  chapters: ForgeChapter[];
  pages: ForgePage[];
  contentError: string | null;
  drafts: Record<number, WriterDraftState>;
  editorError: string | null;
  aiPreview: unknown[] | null;
  aiPreviewMeta: WriterAiPreviewMeta | null;
  aiProposalStatus: WriterAiProposalStatus;
  aiError: string | null;
  aiSelection: unknown | null;
  aiSnapshot: unknown | null;
  aiUndoSnapshot: unknown | null;
  activePageId: number | null;
  expandedActIds: Set<number>;
  expandedChapterIds: Set<number>;
  navigationError: string | null;
  dataAdapter?: unknown;
  actions: Record<string, unknown>;
}
