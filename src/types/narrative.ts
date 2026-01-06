import { NARRATIVE_ENTITY_TYPE, type NarrativeEntityType } from './constants';
import type { Condition } from './index';

export interface NarrativeStoryletExit {
  id: string;
  label: string;
  targetStoryletId?: string;
  targetPageId?: string;
  weight?: number;
  conditions?: Condition[];
}

export interface NarrativeStorylet {
  id: string;
  title: string;
  summary?: string;
  dialogueId?: string;
  tags?: string[];
  weight?: number;
  entryNodeId?: string;
  exits?: NarrativeStoryletExit[];
  notes?: string;
}

export interface NarrativePage {
  id: string;
  title: string;
  summary?: string;
  storylets: NarrativeStorylet[];
  startStoryletId?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface NarrativeChapter {
  id: string;
  title: string;
  summary?: string;
  pages: NarrativePage[];
  startPageId?: string;
}

export interface NarrativeAct {
  id: string;
  title: string;
  summary?: string;
  chapters: NarrativeChapter[];
  startChapterId?: string;
}

export interface NarrativeStructure {
  id: string;
  title: string;
  acts: NarrativeAct[];
  startActId?: string;
  startChapterId?: string;
  startPageId?: string;
}

export interface NarrativeEntityMeta {
  id: string;
  type: NarrativeEntityType;
  actId?: string;
  chapterId?: string;
  pageId?: string;
  storyletId?: string;
}

export const DEFAULT_NARRATIVE_ENTITY_LABELS: Record<NarrativeEntityType, string> = {
  [NARRATIVE_ENTITY_TYPE.ACT]: 'Act',
  [NARRATIVE_ENTITY_TYPE.CHAPTER]: 'Chapter',
  [NARRATIVE_ENTITY_TYPE.PAGE]: 'Page',
  [NARRATIVE_ENTITY_TYPE.STORYLET]: 'Storylet',
};
