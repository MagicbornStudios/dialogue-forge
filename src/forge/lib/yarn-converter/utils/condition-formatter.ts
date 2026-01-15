/**
 * Condition Formatter
 * 
 * Formats ForgeCondition objects to Yarn Spinner syntax.
 * All formatting logic is transparent and easy to update.
 */

import type { ForgeCondition } from '@/forge/types/forge-graph';
import { CONDITION_OPERATOR, CONDITION_OPERATOR_SYMBOLS } from '@/forge/types/constants';

/**
 * Format a single condition to Yarn syntax
 * 
 * Examples:
 * - { flag: "quest", operator: "is_set" } -> "$quest"
 * - { flag: "quest", operator: "is_not_set" } -> "not $quest"
 * - { flag: "count", operator: "equals", value: 5 } -> "$count == 5"
 * - { flag: "count", operator: "greater_than", value: 10 } -> "$count > 10"
 */
export function formatCondition(cond: ForgeCondition): string {
  const varName = `$${cond.flag}`;

  switch (cond.operator) {
    case CONDITION_OPERATOR.IS_SET:
      return varName;

    case CONDITION_OPERATOR.IS_NOT_SET:
      return `${CONDITION_OPERATOR_SYMBOLS.NOT} ${varName}`;

    case CONDITION_OPERATOR.EQUALS:
      if (cond.value === undefined) return varName;
      const equalsValue = typeof cond.value === 'string' ? `"${cond.value}"` : cond.value;
      return `${varName} ${CONDITION_OPERATOR_SYMBOLS.EQUALS} ${equalsValue}`;

    case CONDITION_OPERATOR.NOT_EQUALS:
      if (cond.value === undefined) return `${CONDITION_OPERATOR_SYMBOLS.NOT} ${varName}`;
      const notEqualsValue = typeof cond.value === 'string' ? `"${cond.value}"` : cond.value;
      return `${varName} ${CONDITION_OPERATOR_SYMBOLS.NOT_EQUALS} ${notEqualsValue}`;

    case CONDITION_OPERATOR.GREATER_THAN:
      if (cond.value === undefined) return varName;
      return `${varName} ${CONDITION_OPERATOR_SYMBOLS.GREATER_THAN} ${cond.value}`;

    case CONDITION_OPERATOR.LESS_THAN:
      if (cond.value === undefined) return varName;
      return `${varName} ${CONDITION_OPERATOR_SYMBOLS.LESS_THAN} ${cond.value}`;

    case CONDITION_OPERATOR.GREATER_EQUAL:
      if (cond.value === undefined) return varName;
      return `${varName} ${CONDITION_OPERATOR_SYMBOLS.GREATER_EQUAL} ${cond.value}`;

    case CONDITION_OPERATOR.LESS_EQUAL:
      if (cond.value === undefined) return varName;
      return `${varName} ${CONDITION_OPERATOR_SYMBOLS.LESS_EQUAL} ${cond.value}`;

    default:
      return varName;
  }
}

/**
 * Format multiple conditions joined with AND
 * 
 * Example:
 * - [{ flag: "quest", operator: "is_set" }, { flag: "count", operator: "equals", value: 5 }]
 *   -> "$quest and $count == 5"
 */
export function formatConditions(conditions: ForgeCondition[]): string {
  return conditions
    .map(formatCondition)
    .filter(c => c.length > 0)
    .join(` ${CONDITION_OPERATOR_SYMBOLS.AND} `);
}
