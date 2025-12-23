import { DialogueNode, ConditionalBlock, Choice } from '../../types';
import { VariableManager } from './variable-manager';
import { evaluateConditions } from './condition-evaluator';

export interface ProcessedNodeResult {
  content: string;
  speaker?: string;
  nextNodeId?: string;
  isEnd: boolean;
  isPlayerChoice: boolean;
  choices?: Choice[];
}

/**
 * Processes a dialogue node and returns the result
 */
export function processNode(
  node: DialogueNode,
  variableManager: VariableManager
): ProcessedNodeResult {
  // Player nodes - return choices
  if (node.type === 'player') {
    const availableChoices = node.choices?.filter(choice => {
      if (!choice.conditions) return true;
      return evaluateConditions(
        choice.conditions,
        variableManager.getAllVariables(),
        variableManager.getAllMemoryFlags()
      );
    }) || [];
    
    return {
      content: '',
      speaker: undefined,
      nextNodeId: undefined,
      isEnd: false,
      isPlayerChoice: true,
      choices: availableChoices
    };
  }
  
  // Conditional nodes - evaluate blocks
  if (node.type === 'conditional' && node.conditionalBlocks) {
    const matchedBlock = findMatchingConditionalBlock(node.conditionalBlocks, variableManager);
    
    if (matchedBlock) {
      // Interpolate variables in content
      const interpolatedContent = interpolateVariables(matchedBlock.content, variableManager);
      
      return {
        content: interpolatedContent,
        speaker: matchedBlock.speaker,
        nextNodeId: matchedBlock.nextNodeId || node.nextNodeId,
        isEnd: !matchedBlock.nextNodeId && !node.nextNodeId,
        isPlayerChoice: false,
        choices: undefined
      };
    }
    
    // No block matched - end dialogue
    return {
      content: '',
      speaker: undefined,
      nextNodeId: undefined,
      isEnd: true,
      isPlayerChoice: false,
      choices: undefined
    };
  }
  
  // NPC nodes - handle conditional blocks if present
  if (node.type === 'npc') {
    let content = node.content;
    let speaker = node.speaker;
    let nextNodeId = node.nextNodeId;
    
    // Check for conditional blocks
    if (node.conditionalBlocks && node.conditionalBlocks.length > 0) {
      const matchedBlock = findMatchingConditionalBlock(node.conditionalBlocks, variableManager);
      if (matchedBlock) {
        content = matchedBlock.content;
        speaker = matchedBlock.speaker || node.speaker;
        // Conditional blocks can override nextNodeId
        if (matchedBlock.nextNodeId) {
          nextNodeId = matchedBlock.nextNodeId;
        }
      }
    }
    
    // Interpolate variables in content (e.g., "Hello {$name}")
    content = interpolateVariables(content, variableManager);
    
    return {
      content,
      speaker,
      nextNodeId,
      isEnd: !nextNodeId,
      isPlayerChoice: false,
      choices: undefined
    };
  }
  
  // Default: end dialogue
  return {
    content: '',
    speaker: undefined,
    nextNodeId: undefined,
    isEnd: true,
    isPlayerChoice: false,
    choices: undefined
  };
}

/**
 * Finds the first matching conditional block (if/elseif/else logic)
 */
function findMatchingConditionalBlock(
  blocks: ConditionalBlock[],
  variableManager: VariableManager
): ConditionalBlock | null {
  let matchedBlock: ConditionalBlock | null = null;
  
  for (const block of blocks) {
    if (block.type === 'else') {
      // Only match else if no previous block matched
      if (!matchedBlock) {
        matchedBlock = block;
      }
    } else if (block.condition && block.condition.length > 0) {
      // Check if all conditions in this block are true
      const allMatch = evaluateConditions(
        block.condition,
        variableManager.getAllVariables(),
        variableManager.getAllMemoryFlags()
      );
      if (allMatch) {
        matchedBlock = block;
        break; // Found a match, stop checking (if/elseif matched)
      }
    }
  }
  
  return matchedBlock;
}

/**
 * Interpolates variables in text (e.g., "Hello {$name}" becomes "Hello John")
 */
function interpolateVariables(text: string, variableManager: VariableManager): string {
  // Match {$variable} patterns
  return text.replace(/\{\$(\w+)\}/g, (match, varName) => {
    const value = variableManager.get(varName);
    if (value === undefined) {
      return match; // Keep original if variable not found
    }
    return String(value);
  });
}

/**
 * Validates that a nextNodeId exists and is valid
 */
export function isValidNextNode(nextNodeId: string | undefined, availableNodes: Record<string, DialogueNode>): boolean {
  if (!nextNodeId || !nextNodeId.trim()) {
    return false;
  }
  return !!availableNodes[nextNodeId];
}


