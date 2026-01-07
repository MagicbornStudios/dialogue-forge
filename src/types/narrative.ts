import { NarrativeNodeType, NARRATIVE_NODE_TYPE } from './constants';

export interface NarrativeAct {
  id: string;
  title: string;
  chapterIds: string[];
}

export interface NarrativeChapter {
  id: string;
  title: string;
  actId: string;
  pageIds: string[];
}

export interface NarrativePage {
  id: string;
  title: string;
  chapterId: string;
  dialogueId?: string;
  storyletIds: string[];
}

export interface NarrativeStorylet {
  id: string;
  title: string;
  pageId?: string;
  linkedStoryletIds: string[];
}

export interface NarrativeThread {
  id: string;
  title: string;
  actIds: string[];
  acts: Record<string, NarrativeAct>;
  chapters: Record<string, NarrativeChapter>;
  pages: Record<string, NarrativePage>;
  storylets: Record<string, NarrativeStorylet>;
}

export interface NarrativeNodeDescriptor {
  id: string;
  type: NarrativeNodeType;
}

export const NARRATIVE_NODE_ORDER: NarrativeNodeType[] = [
  NARRATIVE_NODE_TYPE.ACT,
  NARRATIVE_NODE_TYPE.CHAPTER,
  NARRATIVE_NODE_TYPE.PAGE,
  NARRATIVE_NODE_TYPE.STORYLET,
];
