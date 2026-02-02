import type { ForgeGraphDoc } from '@/shared/types/forge-graph';
import type { ForgePage, NarrativeHierarchy } from '@/shared/types/narrative';

export const WRITER_SAVE_STATUS = {
  DIRTY: 'dirty',
  SAVING: 'saving',
  SAVED: 'saved',
  ERROR: 'error',
} as const;

export type WriterSaveStatus =
  (typeof WRITER_SAVE_STATUS)[keyof typeof WRITER_SAVE_STATUS];

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
  // Unified pages array
  pages: ForgePage[];
  // O(1) lookup map for pages by ID
  pageMap: Map<number, ForgePage>;
  
  contentError: string | null;
  editorError: string | null;
  aiPreview: unknown[] | null;
  aiPreviewMeta: WriterAiPreviewMeta | null;
  aiProposalStatus: WriterAiProposalStatus;
  aiError: string | null;
  aiSelection: unknown | null;
  aiSnapshot: unknown | null;
  aiUndoSnapshot: unknown | null;
  
  // Single active page ID
  activePageId: number | null;
  
  // Expanded state for tree navigation
  expandedPageIds: Set<number>;
  
  navigationError: string | null;
  modalState: unknown;
  panelLayout: unknown;
  pageLayout: unknown;
  dataAdapter?: unknown;
  forgeDataAdapter?: unknown;
  narrativeGraphs: ForgeGraphDoc[];
  selectedNarrativeGraphId: number | null;
  narrativeGraph: ForgeGraphDoc | null;
  narrativeHierarchy: NarrativeHierarchy | null;
  committedGraph: ForgeGraphDoc | null;
  draftGraph: ForgeGraphDoc | null;
  deltas: unknown[];
  validation: unknown | null;
  hasUncommittedChanges: boolean;
  lastCommittedAt: Date | null;
  actions: Record<string, unknown>;
}
