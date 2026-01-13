// src/types/narrative.ts
import type { NarrativeForgeNodeType } from './forge/forge-graph';
import { FORGE_GRAPH_KIND } from './forge/forge-graph';

/**
 * Narrative element type constants
 * These map to NarrativeForgeNodeType values
 */
export const NARRATIVE_ELEMENT = {
  ACT: 'ACT',
  CHAPTER: 'CHAPTER',
  PAGE: 'PAGE',
  STORYLET: 'STORYLET',
  DETOUR: 'DETOUR',
  CONDITIONAL: 'CONDITIONAL',
} as const;

export type NarrativeElement = typeof NARRATIVE_ELEMENT[keyof typeof NARRATIVE_ELEMENT];

/**
 * Narrative types - Internal library types
 * 
 * These types are designed to match PayloadCMS collection structures (Act, Chapter, Page)
 * for compatibility, but are independent library types. They do NOT import from host app types.
 * 
 * Host apps should provide transformation utilities to convert PayloadCMS documents
 * to these narrative types. The library itself remains independent and portable.
 * 
 * See agents.md for more details on the type independence pattern.
 */

/**
 * Narrative Act - Internal type matching PayloadCMS Act structure
 * The `id` field references a PayloadCMS Act document ID
 */
export type ForgeAct = {
  id: number;
  title: string;
  summary?: string | null;
  order: number;
  bookHeading?: string | null;
  bookBody?: string | null;
  _status?: 'draft' | 'published' | null;
  project: number;
};

/**
 * Narrative Chapter - Internal type matching PayloadCMS Chapter structure
 * The `id` field references a PayloadCMS Chapter document ID
 * The `act` field references a PayloadCMS Act document ID
 */
export type ForgeChapter = {
  id: number;
  title: string;
  summary?: string | null;
  order: number;
  bookHeading?: string | null;
  bookBody?: string | null;
  _status?: 'draft' | 'published' | null;
  project: number;
  act: number;
};

/**
 * Narrative Page - Internal type matching PayloadCMS Page structure
 * The `id` field references a PayloadCMS Page document ID
 * The `chapter` field references a PayloadCMS Chapter document ID
 * The `dialogueGraph` field references a PayloadCMS ForgeGraph document ID (kind=DIALOGUE)
 */
export type ForgePage = {
  id: number;
  title: string;
  summary?: string | null;
  order: number;
  bookBody?: string | null;
  archivedAt?: string | null;
  _status?: 'draft' | 'published' | null;
  project: number;
  chapter: number;
  dialogueGraph?: number | null;
};

/**
 * Narrative graph structure
 * The narrative graph is a ForgeGraphDoc with kind='NARRATIVE'
 * Nodes reference PayloadCMS documents via actId, chapterId, pageId
 */
import type { ForgeGraphDoc } from './forge/forge-graph';

export interface ForgeNarrativeGraph {
  // The graph itself (must have kind='NARRATIVE')
  graph: ForgeGraphDoc & { kind: typeof FORGE_GRAPH_KIND.NARRATIVE };
  
  // Referenced PayloadCMS documents
  acts: ForgeAct[];
  chapters: ForgeChapter[];
  pages: ForgePage[];
}
