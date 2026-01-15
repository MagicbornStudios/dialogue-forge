/**
 * Node Type and UI Constants for Dialogue Forge
 * 
 * Centralized constants to eliminate duplication across 15+ files.
 * Previously duplicated with identical content across multiple context menu components.
 */

import type { ForgeNodeType, NarrativeForgeNodeType } from '@/forge/types/forge-graph';
import { FORGE_NODE_TYPE, NARRATIVE_FORGE_NODE_TYPE } from '@/forge/types/forge-graph';

/**
 * Forge node type label constants
 * 
 * Labels for ForgeNodeType (used in graph editor)
 */
export const FORGE_NODE_TYPE_LABELS: Record<ForgeNodeType, string> = {
  ACT: 'Act',
  CHAPTER: 'Chapter',
  PAGE: 'Page',
  PLAYER: 'Player Node',
  CHARACTER: 'Character Node',
  CONDITIONAL: 'Conditional Node',
  DETOUR: 'Detour Node',
  JUMP: 'Jump',
  END: 'End',
  STORYLET: 'Storylet Node',
};

/**
 * Narrative node type label constants
 * 
 * Labels for NarrativeForgeNodeType (used in narrative graph editor)
 */
export const NARRATIVE_NODE_TYPE_LABELS: Record<NarrativeForgeNodeType, string> = {
  ACT: 'Act',
  CHAPTER: 'Chapter',
  PAGE: 'Page',
  STORYLET: 'Storylet Node',
  DETOUR: 'Detour Node',
  CONDITIONAL: 'Conditional Node',
};


/**
 * Available narrative node types by context
 * Note: Start node can connect to ACT nodes
 */
export const AVAILABLE_NARRATIVE_NODE_TYPES = {
  /** Node types available from start node connections */
  START_EDGE: [NARRATIVE_FORGE_NODE_TYPE.ACT],
  
  /** Node types available from act node connections */
  ACT_EDGE: [NARRATIVE_FORGE_NODE_TYPE.CHAPTER],
  
  /** Node types available from chapter node connections */
  CHAPTER_EDGE: [NARRATIVE_FORGE_NODE_TYPE.PAGE, NARRATIVE_FORGE_NODE_TYPE.ACT, NARRATIVE_FORGE_NODE_TYPE.CHAPTER],
  
  /** Node types available from page node connections */
  PAGE_EDGE: [NARRATIVE_FORGE_NODE_TYPE.PAGE, NARRATIVE_FORGE_NODE_TYPE.CHAPTER, NARRATIVE_FORGE_NODE_TYPE.ACT],
} as const;


export const AVAILABLE_STORYLET_NODE_TYPES = {
  /** Node types available from player node connections */
  PLAYER_EDGE: [FORGE_NODE_TYPE.CHARACTER, FORGE_NODE_TYPE.DETOUR, FORGE_NODE_TYPE.PLAYER, FORGE_NODE_TYPE.CONDITIONAL],
  
  /** Node types available from character node connections */
  CHARACTER_EDGE: [FORGE_NODE_TYPE.PLAYER, FORGE_NODE_TYPE.DETOUR, FORGE_NODE_TYPE.CONDITIONAL],
  
  /** Node types available from conditional node connections */
  CONDITIONAL_EDGE: [FORGE_NODE_TYPE.CHARACTER, FORGE_NODE_TYPE.PLAYER, FORGE_NODE_TYPE.DETOUR, FORGE_NODE_TYPE.CONDITIONAL],
  
  /** Node types available from storylet node connections */
  STORYLET_EDGE: [],
} as const;

/**
 * Node type styling constants
 * 
 * CSS classes for borders, badges, and labels based on ForgeNodeType.
 * Centralized to eliminate duplication across NodeEditor and node components.
 */
export const NODE_TYPE_BORDER_COLORS: Record<ForgeNodeType, string> = {
  ACT: 'border-blue-500',
  CHAPTER: 'border-emerald-500',
  PAGE: 'border-amber-500',
  PLAYER: 'border-df-player-border',
  CHARACTER: 'border-df-npc-border',
  CONDITIONAL: 'border-df-conditional-border',
  DETOUR: 'border-purple-500',
  JUMP: 'border-pink-500',
  END: 'border-gray-500',
  STORYLET: 'border-df-npc-border',
};

export const NODE_TYPE_BADGE_CLASSES: Record<ForgeNodeType, string> = {
  ACT: 'bg-blue-500/20 text-blue-500',
  CHAPTER: 'bg-emerald-500/20 text-emerald-500',
  PAGE: 'bg-amber-500/20 text-amber-500',
  PLAYER: 'bg-df-player-selected/20 text-df-player-selected',
  CHARACTER: 'bg-df-npc-selected/20 text-df-npc-selected',
  CONDITIONAL: 'bg-df-conditional-border/20 text-df-conditional-border',
  DETOUR: 'bg-purple-500/20 text-purple-500',
  JUMP: 'bg-pink-500/20 text-pink-500',
  END: 'bg-gray-500/20 text-gray-500',
  STORYLET: 'bg-df-npc-selected/20 text-df-npc-selected',
};

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