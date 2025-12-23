import { Condition } from '../../types';
import { CONDITION_OPERATOR } from '../../types/constants';

export interface VariableState {
  [key: string]: boolean | number | string | undefined;
}

/**
 * Evaluates a single condition against variable state
 */
export function evaluateCondition(
  condition: Condition,
  variables: VariableState,
  memoryFlags?: Set<string>
): boolean {
  let value: boolean | number | string | undefined = variables[condition.flag];
  
  // If not in variables, check memoryFlags (dialogue flags)
  if (value === undefined && memoryFlags) {
    value = memoryFlags.has(condition.flag) ? true : undefined;
  }
  
  // For numeric comparisons, treat undefined as 0
  const numericOperators = [
    CONDITION_OPERATOR.GREATER_THAN,
    CONDITION_OPERATOR.LESS_THAN,
    CONDITION_OPERATOR.GREATER_EQUAL,
    CONDITION_OPERATOR.LESS_EQUAL
  ] as const;
  const isNumericComparison = (numericOperators as readonly string[]).includes(condition.operator);
  
  if (isNumericComparison && value === undefined) {
    value = 0;
  }
  
  switch (condition.operator) {
    case CONDITION_OPERATOR.IS_SET:
      return value !== undefined && value !== false && value !== 0 && value !== '';
    case CONDITION_OPERATOR.IS_NOT_SET:
      return value === undefined || value === false || value === 0 || value === '';
    case CONDITION_OPERATOR.EQUALS:
      return value === condition.value;
    case CONDITION_OPERATOR.NOT_EQUALS:
      return value !== condition.value;
    case CONDITION_OPERATOR.GREATER_THAN:
      const numValueGT = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) : 0);
      const numCondGT = typeof condition.value === 'number' ? condition.value : parseFloat(String(condition.value));
      return !isNaN(numValueGT) && !isNaN(numCondGT) && numValueGT > numCondGT;
    case CONDITION_OPERATOR.LESS_THAN:
      const numValueLT = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) : 0);
      const numCondLT = typeof condition.value === 'number' ? condition.value : parseFloat(String(condition.value));
      return !isNaN(numValueLT) && !isNaN(numCondLT) && numValueLT < numCondLT;
    case CONDITION_OPERATOR.GREATER_EQUAL:
      const numValueGE = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) : 0);
      const numCondGE = typeof condition.value === 'number' ? condition.value : parseFloat(String(condition.value));
      return !isNaN(numValueGE) && !isNaN(numCondGE) && numValueGE >= numCondGE;
    case CONDITION_OPERATOR.LESS_EQUAL:
      const numValueLE = typeof value === 'number' ? value : (typeof value === 'string' ? parseFloat(value) : 0);
      const numCondLE = typeof condition.value === 'number' ? condition.value : parseFloat(String(condition.value));
      return !isNaN(numValueLE) && !isNaN(numCondLE) && numValueLE <= numCondLE;
    default:
      return true;
  }
}

/**
 * Evaluates multiple conditions with AND logic
 */
export function evaluateConditions(
  conditions: Condition[],
  variables: VariableState,
  memoryFlags?: Set<string>
): boolean {
  return conditions.every(cond => evaluateCondition(cond, variables, memoryFlags));
}


