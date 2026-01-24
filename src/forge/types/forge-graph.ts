import type { Node, Edge, Viewport } from 'reactflow';
import { CONDITION_OPERATOR, type ConditionOperator } from '@/forge/types/constants';

/**
 * Forge graph kind constants
 */
export const FORGE_GRAPH_KIND = {
  NARRATIVE: 'NARRATIVE',
  STORYLET: 'STORYLET',
} as const;

export type ForgeGraphKind = typeof FORGE_GRAPH_KIND[keyof typeof FORGE_GRAPH_KIND];

/**
 * Forge node type constants
 */
export const FORGE_NODE_TYPE = {
  ACT: 'ACT',
  CHAPTER: 'CHAPTER',
  PAGE: 'PAGE',
  PLAYER: 'PLAYER',
  CHARACTER: 'CHARACTER',
  CONDITIONAL: 'CONDITIONAL',
  DETOUR: 'DETOUR',
  JUMP: 'JUMP',
  END: 'END',
  STORYLET: 'STORYLET',
} as const;

export type ForgeNodeType = typeof FORGE_NODE_TYPE[keyof typeof FORGE_NODE_TYPE];

/**
 * Narrative-specific node types (subset of ForgeNodeType)
 * These are the node types used in narrative graphs
 */
export const NARRATIVE_FORGE_NODE_TYPE = {
  ACT: FORGE_NODE_TYPE.ACT,
  CHAPTER: FORGE_NODE_TYPE.CHAPTER,
  PAGE: FORGE_NODE_TYPE.PAGE,
  STORYLET: FORGE_NODE_TYPE.STORYLET,
  DETOUR: FORGE_NODE_TYPE.DETOUR,
  CONDITIONAL: FORGE_NODE_TYPE.CONDITIONAL,
} as const;

export type NarrativeForgeNodeType = typeof NARRATIVE_FORGE_NODE_TYPE[keyof typeof NARRATIVE_FORGE_NODE_TYPE];

/**
 * Forge edge kind constants
 */
export const FORGE_EDGE_KIND = {
  FLOW: 'FLOW',
  CHOICE: 'CHOICE',
  CONDITION: 'CONDITION',
  DEFAULT: 'DEFAULT',
  VISUAL: 'VISUAL',
} as const;

export type ForgeEdgeKind = typeof FORGE_EDGE_KIND[keyof typeof FORGE_EDGE_KIND];

/**
 * Conditional block type constants
 */
export const FORGE_CONDITIONAL_BLOCK_TYPE = {
  IF: 'if',
  ELSE_IF: 'elseif',
  ELSE: 'else',
} as const;

export type ForgeConditionalBlockType =
  typeof FORGE_CONDITIONAL_BLOCK_TYPE[keyof typeof FORGE_CONDITIONAL_BLOCK_TYPE];

export const CONDITION_VALUE_TYPE = {
  BOOLEAN: 'boolean',
  NUMBER: 'number',
  STRING: 'string',
} as const;

export type ConditionValueType = typeof CONDITION_VALUE_TYPE[keyof typeof CONDITION_VALUE_TYPE];

/**
 * Condition for evaluating flags
 */
export interface ForgeCondition {
  flag: string;
  operator: ConditionOperator;
  value?: ConditionValueType | boolean | number | string;
}

export type ForgeChoice = {
  id: string;
  text: string;
  nextNodeId?: string;
  conditions?: ForgeCondition[];
  setFlags?: string[];
};

/**
 * Conditional content block for if/elseif/else statements
 */
export type ForgeConditionalBlock = {
  id: string;
  type: ForgeConditionalBlockType;
  condition?: ForgeCondition[]; // Required for 'if' and 'elseif', undefined for 'else'
  speaker?: string; // Legacy: text speaker name (deprecated, use characterId)
  characterId?: string; // Character ID from game state
  content?: string;
  nextNodeId?: string; // Optional: where to go after this block's content
  setFlags?: string[];
};

/**
 * Storylet call mode constants
 */
export const FORGE_STORYLET_CALL_MODE = {
  DETOUR_RETURN: 'DETOUR_RETURN',
  JUMP: 'JUMP',
} as const;

export type ForgeStoryletCallMode = typeof FORGE_STORYLET_CALL_MODE[keyof typeof FORGE_STORYLET_CALL_MODE];

export type ForgeStoryletCall = {
  mode: ForgeStoryletCallMode;
  targetGraphId: number;          // Payload doc id of the target forge-graph
  targetStartNodeId?: string;     // optional override; otherwise use target graph's startNodeId
  returnNodeId?: string;
  returnGraphId?: number;
};

export type ForgeNode = {
  // shared
  id?: string;
  type?: ForgeNodeType;
  label?: string;

  // dialogue-ish
  speaker?: string;
  characterId?: string;
  content?: string;
  setFlags?: string[];

  // player
  choices?: ForgeChoice[];

  // conditional
  conditionalBlocks?: ForgeConditionalBlock[];

  // detour/jump
  storyletCall?: ForgeStoryletCall;

  // narrative content references (PayloadCMS IDs)
  actId?: number;
  chapterId?: number;
  pageId?: number;

  // optional semantics for deterministic "book path"
  defaultNextNodeId?: string; // optional: explicitly mark default path
};

export type ForgeReactFlowEdge = Edge & {
  kind?: ForgeEdgeKind;
  label?: string;
  type?: string;
};

export type ForgeReactFlowNode = Node & {
  data?: ForgeNode;
  type?: string;
};

export type ForgeReactFlowJson = {
  nodes: ForgeReactFlowNode[];
  edges: ForgeReactFlowEdge[];
  viewport?: Viewport;
};

export type ForgeGraphDoc = {
  id: number;
  project: number;
  kind: ForgeGraphKind;
  title: string;
  startNodeId: string;
  endNodeIds: { nodeId: string; exitKey?: string }[];
  flow: ForgeReactFlowJson;
  compiledYarn?: string | null;
  updatedAt: string;
  createdAt: string;
};
