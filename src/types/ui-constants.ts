/**
 * Node Type and UI Constants for Dialogue Forge
 * 
 * Centralized constants to eliminate duplication across 15+ files.
 * Previously duplicated with identical content across multiple context menu components.
 */

import { NODE_TYPE, type NodeType } from './constants';
import { NARRATIVE_ELEMENT, type NarrativeElement } from './narrative';

/**
 * Node type label constants
 * 
 * Centralized source of truth for all node type labels.
 * Previously duplicated across 15+ files with identical content.
 */
export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  [NODE_TYPE.NPC]: 'NPC Node',
  [NODE_TYPE.PLAYER]: 'Player Node',
  [NODE_TYPE.CONDITIONAL]: 'Conditional Node',
  [NODE_TYPE.STORYLET]: 'Storylet Node',
  [NODE_TYPE.STORYLET_POOL]: 'Storylet Pool Node',
  [NODE_TYPE.RANDOMIZER]: 'Randomizer Node',
  [NODE_TYPE.DETOUR]: 'Detour Node',
};

/**
 * Available node types by context
 * 
 * Centralized configuration for which node types can be created
 * from different contexts (panes, edges, menus).
 */
export const AVAILABLE_NODE_TYPES = {
  /** Nodes available from graph pane context menu */
  PANE: [NODE_TYPE.NPC, NODE_TYPE.PLAYER, NODE_TYPE.CONDITIONAL],
  
  /** Nodes available from player node edge connections */
  PLAYER_EDGE: [NODE_TYPE.NPC, NODE_TYPE.CONDITIONAL],
  
  /** Nodes available from NPC node edge connections */
  NPC_EDGE: [NODE_TYPE.PLAYER, NODE_TYPE.CONDITIONAL],
  
  /** Nodes available from conditional node connections */
  CONDITIONAL_EDGE: [NODE_TYPE.PLAYER, NODE_TYPE.CONDITIONAL],
  
  /** Nodes available from storylet node connections */
  STORYLET_EDGE: [NODE_TYPE.PLAYER, NODE_TYPE.CONDITIONAL],
} as const;

/**
 * Narrative element label constants
 * 
 * Centralized source of truth for all narrative element labels.
 */
export const NARRATIVE_ELEMENT_LABELS: Record<NarrativeElement, string> = {
  [NARRATIVE_ELEMENT.THREAD]: 'Thread',
  [NARRATIVE_ELEMENT.ACT]: 'Act',
  [NARRATIVE_ELEMENT.CHAPTER]: 'Chapter',
  [NARRATIVE_ELEMENT.PAGE]: 'Page',
  [NARRATIVE_ELEMENT.STORYLET]: 'Storylet',
  [NARRATIVE_ELEMENT.DETOUR]: 'Detour',
  [NARRATIVE_ELEMENT.CONDITIONAL]: 'Conditional',
};

/**
 * Available narrative element types by context
 */
export const AVAILABLE_NARRATIVE_ELEMENTS = {
  /** Elements available from thread node connections */
  THREAD_EDGE: [NARRATIVE_ELEMENT.ACT],
  
  /** Elements available from act node connections */
  ACT_EDGE: [NARRATIVE_ELEMENT.CHAPTER],
  
  /** Elements available from chapter node connections */
  CHAPTER_EDGE: [NARRATIVE_ELEMENT.PAGE, NARRATIVE_ELEMENT.ACT, NARRATIVE_ELEMENT.CHAPTER],
  
  /** Elements available from page node connections */
  PAGE_EDGE: [NARRATIVE_ELEMENT.PAGE, NARRATIVE_ELEMENT.CHAPTER, NARRATIVE_ELEMENT.ACT],
} as const;

/**
 * CSS class constants for common UI patterns
 * 
 * Centralized styling patterns to eliminate CSS class duplication
 * across 26+ instances in the codebase.
 */
export const CSS_CLASSES = {
  /** Primary menu button styling */
  MENU_BUTTON_PRIMARY: 'w-full px-4 py-2 text-sm text-left text-df-text-primary hover:bg-df-control-hover flex items-center gap-2',
  
  /** Secondary menu button styling (for Cancel, etc.) */
  MENU_BUTTON_SECONDARY: 'text-df-text-secondary hover:text-df-text-primary border-t border-df-control-border mt-1',
  
  /** Danger menu button styling (for Delete, etc.) */
  MENU_BUTTON_DANGER: 'text-df-error hover:bg-df-control-hover',
  
  /** Disabled state for menu buttons */
  MENU_BUTTON_DISABLED: 'opacity-50 cursor-not-allowed',
  
  /** Context menu container styling */
  CONTEXT_MENU_CONTAINER: 'bg-df-elevated border border-df-player-border rounded-lg shadow-xl py-1',
  
  /** Context menu title styling */
  CONTEXT_MENU_TITLE: 'px-3 py-1 text-[10px] text-df-text-secondary uppercase border-b border-df-control-border',
} as const;