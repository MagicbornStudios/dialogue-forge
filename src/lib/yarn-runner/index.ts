/**
 * Yarn Spinner Runner
 * 
 * Modular execution engine for running Yarn Spinner dialogue trees.
 * This module provides the core logic for processing nodes, evaluating conditions,
 * and managing state, separate from the UI components.
 */

export { VariableManager } from './variable-manager';
export { evaluateCondition, evaluateConditions } from './condition-evaluator';
export { processNode, isValidNextNode, ProcessedNodeResult } from './node-processor';
export { executeVariableOperation, processVariableOperationsInContent } from './variable-operations';
export type { VariableState } from './condition-evaluator';


