import type { ForgeAct, ForgeChapter, ForgePage } from '@/forge/types/narrative';
import type { ForgeGraphDoc } from '@/forge/types/forge-graph';

export const WRITER_SAVE_STATUS = {
  DIRTY: 'dirty',
  SAVING: 'saving',
  SAVED: 'saved',
  ERROR: 'error',
} as const;

export type WriterSaveStatus =
  (typeof WRITER_SAVE_STATUS)[keyof typeof WRITER_SAVE_STATUS];

export type WriterDraftContent = {
  serialized: string;
  plainText: string;
};

type SerializedLexicalNode = {
  text?: string;
  children?: SerializedLexicalNode[];
};

const extractPlainTextFromSerialized = (serialized: string): string | null => {
  if (!serialized) {
    return '';
  }
  try {
    const parsed = JSON.parse(serialized) as { root?: SerializedLexicalNode };
    if (!parsed || typeof parsed !== 'object' || !parsed.root) {
      return null;
    }
    const parts: string[] = [];
    const walk = (node: SerializedLexicalNode) => {
      if (typeof node.text === 'string') {
        parts.push(node.text);
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(walk);
      }
    };
    walk(parsed.root);
    return parts.join('');
  } catch {
    return null;
  }
};

export const getPlainTextFromSerializedContent = (value?: string | null): string => {
  if (!value) {
    return '';
  }
  return extractPlainTextFromSerialized(value) ?? value;
};

export const createWriterDraftContent = (value?: string | null): WriterDraftContent => ({
  serialized: value ?? '',
  plainText: getPlainTextFromSerializedContent(value),
});

export type WriterDraftState = {
  title: string;
  content: WriterDraftContent;
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
  modalState: unknown;
  panelLayout: unknown;
  pageLayout: unknown;
  dataAdapter?: unknown;
  narrativeGraph: ForgeGraphDoc | null;
  narrativeHierarchy: NarrativeHierarchy | null;
  actions: Record<string, unknown>;
}
