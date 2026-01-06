import { Condition, DialogueTree } from './index';

export const NARRATIVE_NODE_TYPE = {
  ACT: 'act',
  CHAPTER: 'chapter',
  PAGE: 'page',
  STORYLET: 'storylet',
} as const;

export type NarrativeNodeType = typeof NARRATIVE_NODE_TYPE[keyof typeof NARRATIVE_NODE_TYPE];

export const STORYLET_CATEGORY = {
  MERCHANT: 'merchant',
  DUNGEON: 'dungeon',
  ENCOUNTER: 'encounter',
  QUEST: 'quest',
  AMBIENT: 'ambient',
  CUSTOM: 'custom',
} as const;

export type StoryletCategory = typeof STORYLET_CATEGORY[keyof typeof STORYLET_CATEGORY];

export interface NarrativeNodeBase {
  id: string;
  type: NarrativeNodeType;
  title: string;
  description?: string;
  x: number;
  y: number;
  order: number;
  dialogueTreeId?: string;
  storyletIds?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface ActNode extends NarrativeNodeBase {
  type: typeof NARRATIVE_NODE_TYPE.ACT;
  chapterIds: string[];
}

export type ChapterKind = 'prologue' | 'chapter' | 'epilogue';

export interface ChapterNode extends NarrativeNodeBase {
  type: typeof NARRATIVE_NODE_TYPE.CHAPTER;
  actId?: string; // undefined for prologue/epilogue
  pageIds: string[];
  chapterKind?: ChapterKind; // default 'chapter'
}

export interface PageNode extends NarrativeNodeBase {
  type: typeof NARRATIVE_NODE_TYPE.PAGE;
  chapterId: string;
  mainContent?: string;
}

export interface StoryletNode extends NarrativeNodeBase {
  type: typeof NARRATIVE_NODE_TYPE.STORYLET;
  category: StoryletCategory;
  repeatable: boolean;
  cooldown?: number;
  conditions?: Condition[];
  priority?: number;
}

export type NarrativeNode = ActNode | ChapterNode | PageNode | StoryletNode;

export interface Storylet {
  id: string;
  title: string;
  description?: string;
  category: StoryletCategory;
  dialogueTree: DialogueTree;
  conditions?: Condition[];
  repeatable: boolean;
  cooldown?: number;
  tags?: string[];
}

export interface NarrativeThread {
  id: string;
  title: string;
  description?: string;
  actIds: string[];
  nodes: {
    acts: Record<string, ActNode>;
    chapters: Record<string, ChapterNode>;
    pages: Record<string, PageNode>;
  };
  dialogueTrees: Record<string, DialogueTree>;
  storylets: Record<string, Storylet>;
}

export interface NarrativeScope {
  level: 'thread' | 'act' | 'chapter' | 'page' | 'dialogue';
  actId?: string;
  chapterId?: string;
  pageId?: string;
  dialogueTreeId?: string;
}

export interface NarrativeBreadcrumbItem {
  id: string;
  title: string;
  type: 'thread' | NarrativeNodeType | 'dialogue';
}

export interface NarrativeEditorProps {
  thread: NarrativeThread | null;
  onChange: (thread: NarrativeThread) => void;
  className?: string;
  // Event-first, DB-agnostic callbacks (optional)
  onThreadChange?: (thread: NarrativeThread) => void;
  onActsReordered?: (payload: { actIds: string[] }) => void;
  onChaptersReordered?: (payload: { actId: string; chapterIds: string[] }) => void;
  onPagesReordered?: (payload: { chapterId: string; pageIds: string[] }) => void;
  onChapterReparented?: (payload: { chapterId: string; fromActId: string | null; toActId: string; newIndex: number }) => void;
  onPageReparented?: (payload: { pageId: string; fromChapterId: string; toChapterId: string; newIndex: number }) => void;
  onChapterTypeChanged?: (payload: { chapterId: string; chapterKind: ChapterKind }) => void;
  onOpenDialogue?: (payload: { scope: 'act' | 'chapter' | 'page' | 'storylet'; id: string; dialogueTreeId?: string }) => void;
  onPlayMainThread?: () => void;
  onPlayWorld?: (payload: { chapterId: string }) => void;
  onPlayPage?: (payload: { pageId: string }) => void;
  onFocusChange?: (payload: { level: 'thread' | 'act' | 'chapter'; actId?: string; chapterId?: string }) => void;
  onUndo?: (payload: { operationId?: string }) => void;
  onRedo?: (payload: { operationId?: string }) => void;
  onError?: (payload: { operation: string; error: unknown }) => void;
}
