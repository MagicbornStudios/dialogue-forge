import type { Condition } from './conditionals';

export const NARRATIVE_ELEMENT = {
  THREAD: 'thread',
  ACT: 'act',
  CHAPTER: 'chapter',
  PAGE: 'page',
  STORYLET: 'storylet',
  DETOUR: 'detour',
  CONDITIONAL: 'conditional',
} as const;

export type NarrativeElement = typeof NARRATIVE_ELEMENT[keyof typeof NARRATIVE_ELEMENT];

export const STORYLET_SELECTION_MODE = {
  WEIGHTED: 'WEIGHTED',
  UNIFORM: 'UNIFORM',
} as const;

export type StoryletSelectionMode =
  typeof STORYLET_SELECTION_MODE[keyof typeof STORYLET_SELECTION_MODE];

export interface NarrativePage {
  id: string;
  title?: string;
  summary?: string;
  dialogueId: string;
  type?: typeof NARRATIVE_ELEMENT.PAGE;
  nextPageId?: string;
  nextChapterId?: string;
  nextActId?: string;
  position?: { x: number; y: number };
}

export interface NarrativeChapter {
  id: string;
  title?: string;
  summary?: string;
  pages: NarrativePage[];
  storyletTemplates?: StoryletTemplate[];
  storyletPools?: StoryletPool[];
  type?: typeof NARRATIVE_ELEMENT.CHAPTER;
  startPageId?: string;
  position?: { x: number; y: number };
}

export interface NarrativeAct {
  id: string;
  title?: string;
  summary?: string;
  chapters: NarrativeChapter[];
  type?: typeof NARRATIVE_ELEMENT.ACT;
  startChapterId?: string;
  position?: { x: number; y: number };
}

export interface StoryThread {
  id: string;
  title?: string;
  summary?: string;
  acts: NarrativeAct[];
  type?: typeof NARRATIVE_ELEMENT.THREAD;
  startActId?: string;
  position?: { x: number; y: number };
  edges?: NarrativeEdge[];
  detours?: NarrativeDetour[];
  conditionals?: NarrativeConditional[];
}

export interface NarrativeSelection {
  actId?: string;
  chapterId?: string;
  pageId?: string;
  storyletKey?: string;
}

export type NarrativeThread = StoryThread;

export interface StoryletTemplate {
  id: string;
  title?: string;
  summary?: string;
  dialogueId: string;
  conditions?: Condition[];
  type?: typeof NARRATIVE_ELEMENT.STORYLET;
}

export interface StoryletPoolMember {
  templateId: string;
  weight?: number;
}

export interface StoryletPool {
  id: string;
  title?: string;
  summary?: string;
  selectionMode?: StoryletSelectionMode;
  members: StoryletPoolMember[];
  fallbackTemplateId?: string;
}

export interface RandomizerBranch {
  id: string;
  label?: string;
  weight?: number;
  nextNodeId?: string;
  storyletPoolId?: string;
}

export interface NarrativeDetour {
  id: string;
  title?: string;
  summary?: string;
  storyletId: string;
  returnNodeId?: string;
  type: typeof NARRATIVE_ELEMENT.DETOUR;
  position?: { x: number; y: number };
}

export interface NarrativeConditional {
  id: string;
  title?: string;
  conditions: Condition[];
  trueBranchNodeId?: string;
  falseBranchNodeId?: string;
  type: typeof NARRATIVE_ELEMENT.CONDITIONAL;
  position?: { x: number; y: number };
}

export interface NarrativeEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
}

export interface NarrativeGraph {
  nodes: {
    thread?: StoryThread;
    acts: NarrativeAct[];
    chapters: NarrativeChapter[];
    pages: NarrativePage[];
    detours: NarrativeDetour[];
    conditionals: NarrativeConditional[];
  };
  edges: NarrativeEdge[];
  nodePositions: Record<string, { x: number; y: number }>;
}
