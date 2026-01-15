import { FlagSchema } from '@/forge/types/flags';
import type { ForgeCondition } from '@/forge/types/forge-graph';
import { parseCondition as parseConditionFromYarn } from '@/forge/lib/yarn-converter/utils/condition-parser';
import { formatConditions as formatConditionsFromYarn } from '@/forge/lib/yarn-converter/utils/condition-formatter';

export interface ConditionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a Yarn condition expression string
 */
export function validateCondition(
  conditionStr: string,
  flagSchema?: FlagSchema
): ConditionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!conditionStr.trim()) {
    return { isValid: true, errors: [], warnings: [] }; // Empty is valid (optional)
  }
  
  // Check for basic syntax issues
  const parts = conditionStr.split(/\s+and\s+/i);
  let hasValidPart = false;
  
  parts.forEach((part, idx) => {
    part = part.trim();
    if (!part) return;
    
    // Check if it's a valid condition pattern (including literals for always-true/false)
    // Supports all Yarn Spinner alternative syntaxes
    const patterns = [
      /^(?:not|!)\s+\$(\w+)$/i, // not $flag or ! $flag
      /^\$(\w+)\s*(?:>=|gte)\s*(.+)$/i, // $flag >= value or $flag gte value
      /^\$(\w+)\s*(?:<=|lte)\s*(.+)$/i, // $flag <= value or $flag lte value
      /^\$(\w+)\s*(?:!=|neq)\s*(.+)$/i, // $flag != value or $flag neq value
      /^\$(\w+)\s*(?:==|eq|is)\s*(.+)$/i, // $flag == value or $flag eq value or $flag is value
      /^\$(\w+)\s*(?:>|gt)\s*(.+)$/i, // $flag > value or $flag gt value
      /^\$(\w+)\s*(?:<|lt)\s*(.+)$/i, // $flag < value or $flag lt value
      /^\$(\w+)$/, // $flag
      // Allow literal comparisons (for always-true/false expressions)
      /^(.+)\s*(?:==|eq|is)\s*(.+)$/i, // literal == literal (e.g., 1 == 1, true == true)
      /^(.+)\s*(?:!=|neq)\s*(.+)$/i, // literal != literal
      /^(.+)\s*(?:>=|gte)\s*(.+)$/i, // literal >= literal
      /^(.+)\s*(?:<=|lte)\s*(.+)$/i, // literal <= literal
      /^(.+)\s*(?:>|gt)\s*(.+)$/i, // literal > literal
      /^(.+)\s*(?:<|lt)\s*(.+)$/i, // literal < literal
      /^(true|false)$/i, // boolean literals
    ];
    
    const matches = patterns.some(pattern => pattern.test(part));
    if (!matches) {
      errors.push(`Invalid syntax in part ${idx + 1}: "${part}"`);
      return;
    }
    
    hasValidPart = true;
    
    // Extract flag name (only if it starts with $)
    const flagMatch = part.match(/\$(\w+)/);
    if (flagMatch) {
      const flagName = flagMatch[1];
      
      // Check if flag exists in schema
      if (flagSchema) {
        const flagDef = flagSchema.flags.find(f => f.id === flagName);
        if (!flagDef) {
          warnings.push(`Flag "${flagName}" is not defined in your flag schema`);
        } else {
          // Check if operator matches flag type
          // Support all Yarn Spinner comparison syntaxes
          const hasNumericComparison = /(?:>|gt|<|lt|>=|gte|<=|lte)/i.test(part);
          if (hasNumericComparison) {
            if (flagDef.valueType !== 'number') {
              warnings.push(`Flag "${flagName}" is not a number type, but you're using a numeric comparison`);
            }
          }
        }
      } else {
        warnings.push(`No flag schema provided - cannot validate flag "${flagName}"`);
      }
    } else {
      // This is a literal comparison (like "1 == 1" or "true")
      // These are valid but warn that they're unusual
      if (part.match(/^(true|false)$/i)) {
        // Boolean literal - this is fine
      } else if (part.includes('==') || part.includes('!=') || part.includes('>') || part.includes('<')) {
        // Literal comparison - warn that this is unusual but allow it
        warnings.push(`Literal comparison "${part}" will always evaluate to the same result. Consider using a flag variable instead.`);
      }
    }
  });
  
  if (!hasValidPart && conditionStr.trim()) {
    errors.push('Invalid condition syntax. Use: $flag, $flag == value, $flag > 10, 1 == 1, etc.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Parses a Yarn condition expression string into condition objects
 * Re-exports from yarn-converter for consistency
 */
export function parseCondition(conditionStr: string): ForgeCondition[] {
  return parseConditionFromYarn(conditionStr);
}

/**
 * Converts condition objects to a Yarn-style string
 * Re-exports from yarn-converter for consistency
 */
export function conditionToString(conditions: ForgeCondition[]): string {
  if (!conditions || conditions.length === 0) return '';
  return formatConditionsFromYarn(conditions);
}
