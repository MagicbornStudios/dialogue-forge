/**
 * Condition Parser
 * 
 * Parses Yarn Spinner condition syntax to ForgeCondition objects.
 * Handles all Yarn operators and formats.
 */

import type { ForgeCondition } from '@/src/types/forge/forge-graph';
import { CONDITION_OPERATOR, YARN_OPERATOR } from '@/src/types/constants';

/**
 * Parse a Yarn condition string to ForgeCondition[]
 * 
 * Handles:
 * - "$flag" -> IS_SET
 * - "not $flag" -> IS_NOT_SET
 * - "$flag == value" -> EQUALS
 * - "$flag != value" -> NOT_EQUALS
 * - "$flag > value" -> GREATER_THAN
 * - "$flag < value" -> LESS_THAN
 * - "$flag >= value" -> GREATER_EQUAL
 * - "$flag <= value" -> LESS_EQUAL
 * - Multiple conditions joined with "and"
 * 
 * @param conditionStr - Yarn condition string (e.g., "$quest and $count == 5")
 * @returns Array of ForgeCondition objects
 */
export function parseCondition(conditionStr: string): ForgeCondition[] {
  const conditions: ForgeCondition[] = [];

  // Split by 'and' for multiple conditions
  const parts = conditionStr.split(/\s+and\s+/i);

  parts.forEach(part => {
    part = part.trim();
    if (!part) return;

    // Handle "not $flag"
    if (part.startsWith(`${YARN_OPERATOR.NOT} `)) {
      const varMatch = part.match(/not\s+\$(\w+)/);
      if (varMatch) {
        conditions.push({
          flag: varMatch[1],
          operator: CONDITION_OPERATOR.IS_NOT_SET,
        });
      }
      return;
    }

    // Handle comparison operators
    if (part.includes(YARN_OPERATOR.EQUALS)) {
      const match = part.match(/\$(\w+)\s*==\s*(.+)/);
      if (match) {
        const value = parseValue(match[2].trim());
        conditions.push({
          flag: match[1],
          operator: CONDITION_OPERATOR.EQUALS,
          value,
        });
      }
      return;
    }

    if (part.includes(YARN_OPERATOR.NOT_EQUALS)) {
      const match = part.match(/\$(\w+)\s*!=\s*(.+)/);
      if (match) {
        const value = parseValue(match[2].trim());
        conditions.push({
          flag: match[1],
          operator: CONDITION_OPERATOR.NOT_EQUALS,
          value,
        });
      }
      return;
    }

    if (part.includes(YARN_OPERATOR.GREATER_EQUAL)) {
      const match = part.match(/\$(\w+)\s*>=\s*(.+)/);
      if (match) {
        conditions.push({
          flag: match[1],
          operator: CONDITION_OPERATOR.GREATER_EQUAL,
          value: parseFloat(match[2]),
        });
      }
      return;
    }

    if (part.includes(YARN_OPERATOR.LESS_EQUAL)) {
      const match = part.match(/\$(\w+)\s*<=\s*(.+)/);
      if (match) {
        conditions.push({
          flag: match[1],
          operator: CONDITION_OPERATOR.LESS_EQUAL,
          value: parseFloat(match[2]),
        });
      }
      return;
    }

    if (part.includes(YARN_OPERATOR.GREATER_THAN)) {
      const match = part.match(/\$(\w+)\s*>\s*(.+)/);
      if (match) {
        conditions.push({
          flag: match[1],
          operator: CONDITION_OPERATOR.GREATER_THAN,
          value: parseFloat(match[2]),
        });
      }
      return;
    }

    if (part.includes(YARN_OPERATOR.LESS_THAN)) {
      const match = part.match(/\$(\w+)\s*<\s*(.+)/);
      if (match) {
        conditions.push({
          flag: match[1],
          operator: CONDITION_OPERATOR.LESS_THAN,
          value: parseFloat(match[2]),
        });
      }
      return;
    }

    // Simple flag check: "$flag"
    const varMatch = part.match(/\$(\w+)/);
    if (varMatch) {
      conditions.push({
        flag: varMatch[1],
        operator: CONDITION_OPERATOR.IS_SET,
      });
    }
  });

  return conditions;
}

/**
 * Parse a value string to appropriate type
 * Removes quotes from strings, converts numbers
 */
function parseValue(valueStr: string): boolean | number | string {
  // Remove quotes if present
  const unquoted = valueStr.replace(/^["']|["']$/g, '');

  // Try to parse as number
  const num = parseFloat(unquoted);
  if (!isNaN(num) && isFinite(num)) {
    return num;
  }

  // Try to parse as boolean
  if (unquoted === 'true') return true;
  if (unquoted === 'false') return false;

  // Return as string
  return unquoted;
}
