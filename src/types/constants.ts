/**
 * Type-safe constants for Dialogue Forge
 * Use these instead of string literals for better type safety and IDE support
 */

/**
 * View modes for DialogueEditorV2
 */
export const VIEW_MODE = {
  GRAPH: 'graph',
  YARN: 'yarn',
  PLAY: 'play',
} as const;

export type ViewMode = typeof VIEW_MODE[keyof typeof VIEW_MODE];

/**
 * Node types in a dialogue tree
 */
export const NODE_TYPE = {
  NPC: 'npc',
  PLAYER: 'player',
  CONDITIONAL: 'conditional',
  STORYLET: 'storylet',
  STORYLET_POOL: 'storylet_pool',
  RANDOMIZER: 'randomizer',
} as const;

export type NodeType = typeof NODE_TYPE[keyof typeof NODE_TYPE];

/**
 * Flag types for game state management
 */
export const FLAG_TYPE = {
  DIALOGUE: 'dialogue',
  QUEST: 'quest',
  ACHIEVEMENT: 'achievement',
  ITEM: 'item',
  STAT: 'stat',
  TITLE: 'title',
  GLOBAL: 'global',
} as const;

/**
 * Condition operators for choice visibility
 */
export const CONDITION_OPERATOR = {
  IS_SET: 'is_set',
  IS_NOT_SET: 'is_not_set',
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  GREATER_EQUAL: 'greater_equal',
  LESS_EQUAL: 'less_equal',
} as const;

export type ConditionOperator = typeof CONDITION_OPERATOR[keyof typeof CONDITION_OPERATOR];

/**
 * Flag value types
 */
export const FLAG_VALUE_TYPE = {
  BOOLEAN: 'boolean',
  NUMBER: 'number',
  STRING: 'string',
} as const;

export type FlagValueType = typeof FLAG_VALUE_TYPE[keyof typeof FLAG_VALUE_TYPE];

/**
 * Quest state values (common states for quest flags)
 */
export const QUEST_STATE = {
  NOT_STARTED: 'not_started',
  STARTED: 'started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type QuestState = typeof QUEST_STATE[keyof typeof QUEST_STATE];


/**
 * Dialogue Forge event types
 */
export const DIALOGUE_FORGE_EVENT_TYPE = {
  UI_TAB_CHANGED: 'ui.tabChanged',
  NARRATIVE_SELECT: 'narrative.select',
  DIALOGUE_OPEN_REQUESTED: 'dialogue.openRequested',
  DIALOGUE_CHANGED: 'dialogue.changed',
  STORYLET_TEMPLATE_OPEN_REQUESTED: 'storyletTemplate.openRequested',
} as const;

export type DialogueForgeEventType = typeof DIALOGUE_FORGE_EVENT_TYPE[keyof typeof DIALOGUE_FORGE_EVENT_TYPE];

/**
 * Dialogue panel tab types
 */
export const DIALOGUE_PANEL_TAB = {
  PAGE: 'page',
  STORYLET_TEMPLATE: 'storyletTemplate',
} as const;

export type DialoguePanelTab = typeof DIALOGUE_PANEL_TAB[keyof typeof DIALOGUE_PANEL_TAB];

/**
 * Dialogue open reason types
 */
export const DIALOGUE_OPEN_REASON = {
  PAGE: 'page',
  STORYLET_TEMPLATE: 'storyletTemplate',
} as const;

export type DialogueOpenReason = typeof DIALOGUE_OPEN_REASON[keyof typeof DIALOGUE_OPEN_REASON];
