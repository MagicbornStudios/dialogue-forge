import { CONDITION_OPERATOR, type ConditionOperator } from './constants';

export const CONDITIONAL_BLOCK_TYPE = {
  IF: 'if',
  ELSE_IF: 'elseif',
  ELSE: 'else',
} as const;

export type ConditionalBlockType =
  typeof CONDITIONAL_BLOCK_TYPE[keyof typeof CONDITIONAL_BLOCK_TYPE];

export interface Condition {
  flag: string;
  operator: ConditionOperator;
  value?: boolean | number | string;
}

/**
 * Conditional content block for if/elseif/else statements
 */
export interface ConditionalBlock {
  id: string;
  type: ConditionalBlockType;
  condition?: Condition[]; // Required for 'if' and 'elseif', undefined for 'else'
  content: string;
  speaker?: string; // Legacy: text speaker name (deprecated, use characterId)
  characterId?: string; // Character ID from game state
  nextNodeId?: string; // Optional: where to go after this block's content
}

export const CONDITION_OPERATORS = CONDITION_OPERATOR;
