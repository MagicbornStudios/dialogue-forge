/**
 * Regex patterns for parsing Yarn Spinner condition syntax
 * 
 * All patterns are case-insensitive and support Yarn's alternative syntaxes
 */

/**
 * Pattern to split conditions by AND operator (and, &&)
 * Note: OR (or, ||) and XOR (xor, ^) are not yet supported
 */
export const CONDITION_SEPARATOR_PATTERN = /\s+(?:and|&&)\s+/i;

/**
 * Pattern to match a simple flag variable: $flag
 * Captures the flag name in group 1
 */
export const FLAG_VARIABLE_PATTERN = /\$(\w+)/;

/**
 * Pattern to match NOT operator with flag: "not $flag" or "! $flag"
 * Captures the flag name in group 1
 */
export const NOT_FLAG_PATTERN = /^(?:not|!)\s+\$(\w+)/i;

/**
 * Pattern to match equality operators: ==, eq, is
 * Captures flag name in group 1, value in group 2
 */
export const EQUALS_PATTERN = /\$(\w+)\s*(?:==|eq|is)\s+(.+)/i;

/**
 * Pattern to match inequality operators: !=, neq
 * Captures flag name in group 1, value in group 2
 */
export const NOT_EQUALS_PATTERN = /\$(\w+)\s*(?:!=|neq)\s+(.+)/i;

/**
 * Pattern to match greater than or equal: >=, gte
 * Captures flag name in group 1, value in group 2
 */
export const GREATER_EQUAL_PATTERN = /\$(\w+)\s*(?:>=|gte)\s+(.+)/i;

/**
 * Pattern to match less than or equal: <=, lte
 * Captures flag name in group 1, value in group 2
 */
export const LESS_EQUAL_PATTERN = /\$(\w+)\s*(?:<=|lte)\s+(.+)/i;

/**
 * Pattern to match greater than: >, gt
 * Captures flag name in group 1, value in group 2
 */
export const GREATER_THAN_PATTERN = /\$(\w+)\s*(?:>|gt)\s+(.+)/i;

/**
 * Pattern to match less than: <, lt
 * Captures flag name in group 1, value in group 2
 */
export const LESS_THAN_PATTERN = /\$(\w+)\s*(?:<|lt)\s+(.+)/i;

/**
 * Pattern to remove quotes from string values
 * Matches single or double quotes at start and end
 */
export const QUOTE_REMOVAL_PATTERN = /^["']|["']$/g;
