/**
 * Forge-specific constants
 * 
 * Shared constants (VIEW_MODE, FLAG_TYPE, etc.) are exported from
 * @magicborn/shared/types/constants
 * This file contains only Forge domain-specific constants.
 */

// Re-export shared constants for convenience
export * from '@magicborn/shared/types/constants';


/**
 * Dialogue Forge event types
 */
export const FORGE_EVENT_TYPE = {
  UI_TAB_CHANGED: 'ui.tabChanged',
  GRAPH_CHANGED: 'graph.changed',
  GRAPH_OPEN_REQUESTED: 'graph.openRequested',
} as const;

export const GRAPH_CHANGE_REASON = {
  OPEN: 'open',
  CLOSE: 'close',
} as const;

export type GraphChangeReason = typeof GRAPH_CHANGE_REASON[keyof typeof GRAPH_CHANGE_REASON];

export const GRAPH_SCOPE = {
  NARRATIVE: 'narrative',
  STORYLET: 'storylet',
} as const;

export type GraphScope = typeof GRAPH_SCOPE[keyof typeof GRAPH_SCOPE];

export type ForgeEventType = typeof FORGE_EVENT_TYPE[keyof typeof FORGE_EVENT_TYPE];

