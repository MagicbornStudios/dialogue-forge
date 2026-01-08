import type { Condition } from './conditionals';

export const NARRATIVE_ELEMENT = {
  THREAD: 'thread',
  ACT: 'act',
  CHAPTER: 'chapter',
  PAGE: 'page',
  STORYLET: 'storylet',
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
}

export interface NarrativeChapter {
  id: string;
  title?: string;
  summary?: string;
  pages: NarrativePage[];
  storyletTemplates?: StoryletTemplate[];
  storyletPools?: StoryletPool[];
  type?: typeof NARRATIVE_ELEMENT.CHAPTER;
}

export interface NarrativeAct {
  id: string;
  title?: string;
  summary?: string;
  chapters: NarrativeChapter[];
  type?: typeof NARRATIVE_ELEMENT.ACT;
}

export interface StoryThread {
  id: string;
  title?: string;
  summary?: string;
  acts: NarrativeAct[];
  type?: typeof NARRATIVE_ELEMENT.THREAD;
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
