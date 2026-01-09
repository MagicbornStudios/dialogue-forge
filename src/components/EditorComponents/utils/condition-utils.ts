import { CONDITION_OPERATOR } from '../../../types/constants';
import { FlagSchema } from '../../../types/flags';

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
    const patterns = [
      /^not\s+\$(\w+)$/, // not $flag
      /^\$(\w+)\s*>=\s*(.+)$/, // $flag >= value
      /^\$(\w+)\s*<=\s*(.+)$/, // $flag <= value
      /^\$(\w+)\s*!=\s*(.+)$/, // $flag != value
      /^\$(\w+)\s*==\s*(.+)$/, // $flag == value
      /^\$(\w+)\s*>\s*(.+)$/, // $flag > value
      /^\$(\w+)\s*<\s*(.+)$/, // $flag < value
      /^\$(\w+)$/, // $flag
      // Allow literal comparisons (for always-true/false expressions)
      /^(.+)\s*==\s*(.+)$/, // literal == literal (e.g., 1 == 1, true == true)
      /^(.+)\s*!=\s*(.+)$/, // literal != literal
      /^(.+)\s*>=\s*(.+)$/, // literal >= literal
      /^(.+)\s*<=\s*(.+)$/, // literal <= literal
      /^(.+)\s*>\s*(.+)$/, // literal > literal
      /^(.+)\s*<\s*(.+)$/, // literal < literal
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
          if (part.includes('>') || part.includes('<') || part.includes('>=') || part.includes('<=')) {
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
 */
export function parseCondition(conditionStr: string): any[] {
  const conditions: any[] = [];
  if (!conditionStr.trim()) return conditions;
  
  const parts = conditionStr.split(/\s+and\s+/i);
  parts.forEach(part => {
    part = part.trim();
    if (part.startsWith('not ')) {
      const varMatch = part.match(/not\s+\$(\w+)/);
      if (varMatch) {
        conditions.push({ flag: varMatch[1], operator: CONDITION_OPERATOR.IS_NOT_SET });
      }
    } else if (part.includes('>=')) {
      const match = part.match(/\$(\w+)\s*>=\s*(.+)/);
      if (match) {
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        conditions.push({ flag: match[1], operator: CONDITION_OPERATOR.GREATER_EQUAL, value: isNaN(Number(value)) ? value : Number(value) });
      }
    } else if (part.includes('<=')) {
      const match = part.match(/\$(\w+)\s*<=\s*(.+)/);
      if (match) {
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        conditions.push({ flag: match[1], operator: CONDITION_OPERATOR.LESS_EQUAL, value: isNaN(Number(value)) ? value : Number(value) });
      }
    } else if (part.includes('!=')) {
      const match = part.match(/\$(\w+)\s*!=\s*(.+)/);
      if (match) {
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        conditions.push({ flag: match[1], operator: CONDITION_OPERATOR.NOT_EQUALS, value: isNaN(Number(value)) ? value : Number(value) });
      }
    } else if (part.includes('==')) {
      const match = part.match(/\$(\w+)\s*==\s*(.+)/);
      if (match) {
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        conditions.push({ flag: match[1], operator: CONDITION_OPERATOR.EQUALS, value: isNaN(Number(value)) ? value : Number(value) });
      }
    } else if (part.includes('>') && !part.includes('>=')) {
      const match = part.match(/\$(\w+)\s*>\s*(.+)/);
      if (match) {
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        conditions.push({ flag: match[1], operator: CONDITION_OPERATOR.GREATER_THAN, value: isNaN(Number(value)) ? value : Number(value) });
      }
    } else if (part.includes('<') && !part.includes('<=')) {
      const match = part.match(/\$(\w+)\s*<\s*(.+)/);
      if (match) {
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        conditions.push({ flag: match[1], operator: CONDITION_OPERATOR.LESS_THAN, value: isNaN(Number(value)) ? value : Number(value) });
      }
    } else {
      const varMatch = part.match(/\$(\w+)/);
      if (varMatch) {
        conditions.push({ flag: varMatch[1], operator: CONDITION_OPERATOR.IS_SET });
      }
    }
  });
  return conditions;
}

/**
 * Converts condition objects to a Yarn-style string
 */
export function conditionToString(conditions: any[]): string {
  if (!conditions || conditions.length === 0) return '';
  
  return conditions.map(cond => {
    const varName = `$${cond.flag}`;
    if (cond.operator === CONDITION_OPERATOR.IS_SET) {
      return varName;
    } else if (cond.operator === CONDITION_OPERATOR.IS_NOT_SET) {
      return `not ${varName}`;
    } else if (cond.value !== undefined) {
      const op = cond.operator === CONDITION_OPERATOR.EQUALS ? '==' :
                cond.operator === CONDITION_OPERATOR.NOT_EQUALS ? '!=' :
                cond.operator === CONDITION_OPERATOR.GREATER_THAN ? '>' :
                cond.operator === CONDITION_OPERATOR.LESS_THAN ? '<' :
                cond.operator === CONDITION_OPERATOR.GREATER_EQUAL ? '>=' :
                cond.operator === CONDITION_OPERATOR.LESS_EQUAL ? '<=' : '==';
      const value = typeof cond.value === 'string' ? `"${cond.value}"` : cond.value;
      return `${varName} ${op} ${value}`;
    }
    return '';
  }).filter(c => c).join(' and ') || '';
}
