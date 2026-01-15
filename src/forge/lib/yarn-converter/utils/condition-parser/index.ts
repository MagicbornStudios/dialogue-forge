/**
 * Condition Parser
 * 
 * Parses Yarn Spinner condition syntax to ForgeCondition objects.
 * Handles all Yarn operators and formats.
 */

import type { ForgeCondition } from '@/forge/types/forge-graph';
import { CONDITION_OPERATOR } from '@/forge/types/constants';
import {
  CONDITION_SEPARATOR_PATTERN,
  FLAG_VARIABLE_PATTERN,
  NOT_FLAG_PATTERN,
  EQUALS_PATTERN,
  NOT_EQUALS_PATTERN,
  GREATER_EQUAL_PATTERN,
  LESS_EQUAL_PATTERN,
  GREATER_THAN_PATTERN,
  LESS_THAN_PATTERN,
} from './patterns';
import { parseValue, normalizeNumericValue } from './utils';

/**
 * Parse a Yarn condition string to ForgeCondition[]
 * 
 * Handles all Yarn Spinner operator syntaxes:
 * - "$flag" -> IS_SET
 * - "not $flag" or "! $flag" -> IS_NOT_SET
 * - "$flag == value" or "$flag eq value" or "$flag is value" -> EQUALS
 * - "$flag != value" or "$flag neq value" -> NOT_EQUALS
 * - "$flag > value" or "$flag gt value" -> GREATER_THAN
 * - "$flag < value" or "$flag lt value" -> LESS_THAN
 * - "$flag >= value" or "$flag gte value" -> GREATER_EQUAL
 * - "$flag <= value" or "$flag lte value" -> LESS_EQUAL
 * - Multiple conditions joined with "and" or "&&"
 * 
 * Note: OR (or, ||) and XOR (xor, ^) are not yet supported for combining conditions
 * 
 * @param conditionStr - Yarn condition string (e.g., "$quest and $count == 5")
 * @returns Array of ForgeCondition objects
 */
export function parseCondition(conditionStr: string): ForgeCondition[] {
  const conditions: ForgeCondition[] = [];

  // Split by 'and' or '&&' for multiple conditions (OR/XOR not yet supported)
  const parts = conditionStr.split(CONDITION_SEPARATOR_PATTERN);

  parts.forEach(part => {
    part = part.trim();
    if (!part) return;

    // Handle "not $flag" or "! $flag"
    const notMatch = part.match(NOT_FLAG_PATTERN);
    if (notMatch) {
      conditions.push({
        flag: notMatch[1],
        operator: CONDITION_OPERATOR.IS_NOT_SET,
      });
      return;
    }

    // Handle equality operators: ==, eq, is
    const equalsMatch = part.match(EQUALS_PATTERN);
    if (equalsMatch) {
      const value = parseValue(equalsMatch[2].trim());
      conditions.push({
        flag: equalsMatch[1],
        operator: CONDITION_OPERATOR.EQUALS,
        value,
      });
      return;
    }

    // Handle inequality operators: !=, neq
    const notEqualsMatch = part.match(NOT_EQUALS_PATTERN);
    if (notEqualsMatch) {
      const value = parseValue(notEqualsMatch[2].trim());
      conditions.push({
        flag: notEqualsMatch[1],
        operator: CONDITION_OPERATOR.NOT_EQUALS,
        value,
      });
      return;
    }

    // Handle greater than or equal: >=, gte
    const greaterEqualMatch = part.match(GREATER_EQUAL_PATTERN);
    if (greaterEqualMatch) {
      const value = parseValue(greaterEqualMatch[2].trim());
      conditions.push({
        flag: greaterEqualMatch[1],
        operator: CONDITION_OPERATOR.GREATER_EQUAL,
        value: normalizeNumericValue(value),
      });
      return;
    }

    // Handle less than or equal: <=, lte
    const lessEqualMatch = part.match(LESS_EQUAL_PATTERN);
    if (lessEqualMatch) {
      const value = parseValue(lessEqualMatch[2].trim());
      conditions.push({
        flag: lessEqualMatch[1],
        operator: CONDITION_OPERATOR.LESS_EQUAL,
        value: normalizeNumericValue(value),
      });
      return;
    }

    // Handle greater than: >, gt
    const greaterThanMatch = part.match(GREATER_THAN_PATTERN);
    if (greaterThanMatch) {
      const value = parseValue(greaterThanMatch[2].trim());
      conditions.push({
        flag: greaterThanMatch[1],
        operator: CONDITION_OPERATOR.GREATER_THAN,
        value: normalizeNumericValue(value),
      });
      return;
    }

    // Handle less than: <, lt
    const lessThanMatch = part.match(LESS_THAN_PATTERN);
    if (lessThanMatch) {
      const value = parseValue(lessThanMatch[2].trim());
      conditions.push({
        flag: lessThanMatch[1],
        operator: CONDITION_OPERATOR.LESS_THAN,
        value: normalizeNumericValue(value),
      });
      return;
    }

    // Simple flag check: "$flag"
    const varMatch = part.match(FLAG_VARIABLE_PATTERN);
    if (varMatch) {
      conditions.push({
        flag: varMatch[1],
        operator: CONDITION_OPERATOR.IS_SET,
      });
    }
  });

  return conditions;
}
