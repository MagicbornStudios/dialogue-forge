/**
 * Utility functions for condition parsing
 */

import { QUOTE_REMOVAL_PATTERN } from './patterns';

/**
 * Parse a value string to appropriate type
 * 
 * Handles:
 * - Quoted strings: "hello" -> hello
 * - Numbers: 5 -> 5 (number)
 * - Booleans: true -> true, false -> false
 * - Unquoted strings: hello -> "hello" (string)
 * 
 * @param valueStr - The value string to parse
 * @returns Parsed value as boolean, number, or string
 */
export function parseValue(valueStr: string): boolean | number | string {
  // Remove quotes if present
  const unquoted = valueStr.replace(QUOTE_REMOVAL_PATTERN, '');

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

/**
 * Normalize a numeric value for comparison operators
 * Ensures numeric comparison operators get numeric values
 * 
 * @param value - The parsed value
 * @returns Number if value can be converted, otherwise original value
 */
export function normalizeNumericValue(value: boolean | number | string): number | boolean | string {
  if (typeof value === 'number') {
    return value;
  }
  
  // Try to convert string to number for comparison operators
  const num = parseFloat(String(value));
  if (!isNaN(num) && isFinite(num)) {
    return num;
  }
  
  return value;
}
