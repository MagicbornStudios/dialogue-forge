/**
 * Type-safe constants for Dialogue Forge
 * Use these instead of string literals for better type safety and IDE support
 */

/**
 * View modes for DialogueGraphEditor
 */
export const VIEW_MODE = {
  GRAPH: 'graph',
  YARN: 'yarn',
  PLAY: 'play',
} as const;

export type ViewMode = typeof VIEW_MODE[keyof typeof VIEW_MODE];


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



/**
 * Yarn Spinner operator constants for generating Yarn syntax
 */
export const YARN_OPERATOR = {
  EQUALS: '==',
  NOT_EQUALS: '!=',
  GREATER_THAN: '>',
  LESS_THAN: '<',
  GREATER_EQUAL: '>=',
  LESS_EQUAL: '<=',
  NOT: 'not',
  AND: 'and',
} as const;

export type YarnOperator = typeof YARN_OPERATOR[keyof typeof YARN_OPERATOR];

/**
 * Yarn block type constants for Yarn syntax generation
 */
export const YARN_BLOCK_TYPE = {
  IF: 'if',
  ELSEIF: 'elseif',
  ELSE: 'else',
  ENDIF: 'endif',
} as const;

export type YarnBlockType = typeof YARN_BLOCK_TYPE[keyof typeof YARN_BLOCK_TYPE];
