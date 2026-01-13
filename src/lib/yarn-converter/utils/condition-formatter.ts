/**
 * Condition Formatter
 * 
 * Formats ForgeCondition objects to Yarn Spinner syntax.
 * All formatting logic is transparent and easy to update.
 */

import type { ForgeCondition } from '@/src/types/forge/forge-graph';
import { CONDITION_OPERATOR, YARN_OPERATOR } from '@/src/types/constants';

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
      return `${YARN_OPERATOR.NOT} ${varName}`;

    case CONDITION_OPERATOR.EQUALS:
      if (cond.value === undefined) return varName;
      const equalsValue = typeof cond.value === 'string' ? `"${cond.value}"` : cond.value;
      return `${varName} ${YARN_OPERATOR.EQUALS} ${equalsValue}`;

    case CONDITION_OPERATOR.NOT_EQUALS:
      if (cond.value === undefined) return `${YARN_OPERATOR.NOT} ${varName}`;
      const notEqualsValue = typeof cond.value === 'string' ? `"${cond.value}"` : cond.value;
      return `${varName} ${YARN_OPERATOR.NOT_EQUALS} ${notEqualsValue}`;

    case CONDITION_OPERATOR.GREATER_THAN:
      if (cond.value === undefined) return varName;
      return `${varName} ${YARN_OPERATOR.GREATER_THAN} ${cond.value}`;

    case CONDITION_OPERATOR.LESS_THAN:
      if (cond.value === undefined) return varName;
      return `${varName} ${YARN_OPERATOR.LESS_THAN} ${cond.value}`;

    case CONDITION_OPERATOR.GREATER_EQUAL:
      if (cond.value === undefined) return varName;
      return `${varName} ${YARN_OPERATOR.GREATER_EQUAL} ${cond.value}`;

    case CONDITION_OPERATOR.LESS_EQUAL:
      if (cond.value === undefined) return varName;
      return `${varName} ${YARN_OPERATOR.LESS_EQUAL} ${cond.value}`;

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
    .join(` ${YARN_OPERATOR.AND} `);
}
