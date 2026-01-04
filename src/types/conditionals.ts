import { ConditionOperator } from './constants';

/**
 * Conditional block for Yarn Spinner if/elseif/else/endif
 */
export interface ConditionalBlock {
  type: 'if' | 'elseif' | 'else';
  condition?: {
    flag: string;
    operator: ConditionOperator | 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal';
    value?: boolean | number | string;
  };
  content: string; // Dialogue content within this block
  nextNodeId?: string; // Optional jump after this block
}

/**
 * Extended DialogueNode with conditional support
 */
export interface ConditionalDialogueNode {
  id: string;
  type: 'npc' | 'player' | 'conditional';
  speaker?: string;
  content: string;
  choices?: any[];
  nextNodeId?: string;
  setFlags?: string[];
  conditionals?: ConditionalBlock[]; // For conditional nodes
  x: number;
  y: number;
}






