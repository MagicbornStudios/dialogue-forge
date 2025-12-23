import { VariableManager } from './variable-manager';

/**
 * Parses and executes a Yarn variable operation command
 * Supports:
 * - <<set $var = value>> (assignment)
 * - <<set $var += value>> (addition)
 * - <<set $var -= value>> (subtraction)
 * - <<set $var *= value>> (multiplication)
 * - <<set $var /= value>> (division)
 */
export function executeVariableOperation(
  command: string,
  variableManager: VariableManager
): void {
  // Match: <<set $var = value>> or <<set $var += value>> etc.
  const setMatch = command.match(/<<set\s+\$(\w+)\s*([+\-*/=]+)\s*(.+?)>>/);
  if (!setMatch) {
    return; // Invalid command, skip
  }

  const varName = setMatch[1];
  const operator = setMatch[2].trim();
  const valueStr = setMatch[3].trim();

  // Parse the value
  let value: boolean | number | string;
  
  // Try to parse as number first
  const numValue = parseFloat(valueStr);
  if (!isNaN(numValue) && valueStr === String(numValue)) {
    value = numValue;
  } else if (valueStr === 'true') {
    value = true;
  } else if (valueStr === 'false') {
    value = false;
  } else {
    // Remove quotes if present
    value = valueStr.replace(/^["']|["']$/g, '');
  }

  // Handle operations
  if (operator === '=') {
    // Simple assignment
    variableManager.set(varName, value);
  } else if (operator === '+=') {
    // Addition
    if (typeof value === 'number') {
      variableManager.applyOperation(varName, '+', value);
    } else {
      // String concatenation
      const current = variableManager.get(varName);
      const currentStr = current !== undefined ? String(current) : '';
      variableManager.set(varName, currentStr + String(value));
    }
  } else if (operator === '-=') {
    // Subtraction (numeric only)
    if (typeof value === 'number') {
      variableManager.applyOperation(varName, '-', value);
    }
  } else if (operator === '*=') {
    // Multiplication (numeric only)
    if (typeof value === 'number') {
      variableManager.applyOperation(varName, '*', value);
    }
  } else if (operator === '/=') {
    // Division (numeric only)
    if (typeof value === 'number') {
      variableManager.applyOperation(varName, '/', value);
    }
  }
}

/**
 * Extracts and executes all variable operations from a node's content
 * This processes any <<set>> commands embedded in the dialogue text
 */
export function processVariableOperationsInContent(
  content: string,
  variableManager: VariableManager
): string {
  // Find all <<set>> commands
  const setCommandRegex = /<<set\s+\$(\w+)\s*([+\-*/=]+)\s*(.+?)>>/g;
  let processedContent = content;
  let match;

  while ((match = setCommandRegex.exec(content)) !== null) {
    // Execute the command
    executeVariableOperation(match[0], variableManager);
    // Remove the command from content (it's executed, not displayed)
    processedContent = processedContent.replace(match[0], '');
  }

  return processedContent.trim();
}



