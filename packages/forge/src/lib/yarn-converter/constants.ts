/**
 * Yarn block type constants for Yarn syntax generation.
 * Kept in a separate file to avoid circular imports (index -> handlers -> builders -> index).
 */
export const CONDITION_BLOCK_TYPE = {
  IF: 'if',
  ELSEIF: 'elseif',
  ELSE: 'else',
  ENDIF: 'endif',
} as const;

export type ConditionBlockType = typeof CONDITION_BLOCK_TYPE[keyof typeof CONDITION_BLOCK_TYPE];
