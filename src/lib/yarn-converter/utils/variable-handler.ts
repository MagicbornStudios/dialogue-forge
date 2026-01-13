/**
 * Variable Handler
 * 
 * Handles Yarn variable commands (<<set>>) and flag operations.
 * Provides formatting and parsing for variable operations.
 */

/**
 * Format a set command
 * 
 * Produces: "<<set $flag = value>>"
 * 
 * @param flag - Flag/variable name (without $)
 * @param value - Value to set (defaults to true)
 * @returns Formatted set command string
 */
export function formatSetCommand(flag: string, value: any = true): string {
  const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
  return `<<set $${flag} = ${valueStr}>>`;
}

/**
 * Parse a set command
 * 
 * Extracts flag name, operator, and value from commands like:
 * - "<<set $var = value>>"
 * - "<<set $var += value>>"
 * - "<<set $var -= value>>"
 * 
 * @param cmd - Set command string
 * @returns Parsed command data
 */
export function parseSetCommand(cmd: string): {
  flag: string;
  operator: string;
  value: any;
} | null {
  const match = cmd.match(/<<set\s+\$(\w+)\s*([+\-*/=]+)\s*(.+?)>>/);
  if (!match) return null;

  const [, flag, operator, valueStr] = match;
  const trimmedValue = valueStr.trim();

  // Parse value type
  let value: any = trimmedValue;
  
  // Remove quotes if present
  if ((trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
      (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))) {
    value = trimmedValue.slice(1, -1);
  } else {
    // Try to parse as number
    const num = parseFloat(trimmedValue);
    if (!isNaN(num) && isFinite(num)) {
      value = num;
    } else if (trimmedValue === 'true') {
      value = true;
    } else if (trimmedValue === 'false') {
      value = false;
    }
  }

  return {
    flag,
    operator: operator.trim(),
    value,
  };
}

/**
 * Format flags array as set commands
 * 
 * @param flags - Array of flag names
 * @param defaultValue - Default value (defaults to true)
 * @returns Array of formatted set commands
 */
export function formatFlagsAsSetCommands(flags: string[], defaultValue: any = true): string[] {
  return flags.map(flag => formatSetCommand(flag, defaultValue));
}
