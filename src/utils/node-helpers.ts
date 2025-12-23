import { DialogueNode, DialogueTree, Choice } from '../types';
import { NODE_TYPE, NodeType } from '../types/constants';

export function createNode(
  type: NodeType,
  id: string,
  x: number,
  y: number
): DialogueNode {
  if (type === NODE_TYPE.NPC) {
    return {
      id,
      type,
      content: 'New dialogue...',
      speaker: 'Character',
      x,
      y
    };
  } else if (type === NODE_TYPE.PLAYER) {
    return {
      id,
      type,
      content: '',
      choices: [{ id: `c_${Date.now()}`, text: 'Choice 1', nextNodeId: '' }],
      x,
      y
    };
  } else if (type === NODE_TYPE.CONDITIONAL) {
    return {
      id,
      type,
      content: '',
      conditionalBlocks: [{
        id: `block_${Date.now()}`,
        type: 'if',
        condition: [],
        content: 'New dialogue...',
        speaker: undefined
      }],
      x,
      y
    };
  }
  
  // Fallback
  return {
    id,
    type,
    content: '',
    x,
    y
  };
}

export function addChoiceToNode(node: DialogueNode): DialogueNode {
  if (node.type !== NODE_TYPE.PLAYER) return node;
  const newChoice: Choice = {
    id: `c_${Date.now()}`,
    text: 'New choice...',
    nextNodeId: ''
  };
  return {
    ...node,
    choices: [...(node.choices || []), newChoice]
  };
}

export function removeChoiceFromNode(node: DialogueNode, choiceIdx: number): DialogueNode {
  if (node.type !== NODE_TYPE.PLAYER || !node.choices) return node;
  return {
    ...node,
    choices: node.choices.filter((_, i) => i !== choiceIdx)
  };
}

export function updateChoiceInNode(
  node: DialogueNode,
  choiceIdx: number,
  updates: Partial<Choice>
): DialogueNode {
  if (node.type !== NODE_TYPE.PLAYER || !node.choices) return node;
  const newChoices = [...node.choices];
  newChoices[choiceIdx] = { ...newChoices[choiceIdx], ...updates };
  return { ...node, choices: newChoices };
}

export function deleteNodeFromTree(tree: DialogueTree, nodeId: string): DialogueTree {
  if (nodeId === tree.startNodeId) {
    throw new Error("Cannot delete the start node");
  }
  
  const { [nodeId]: _, ...rest } = tree.nodes;
  
  // Remove references to deleted node
  Object.keys(rest).forEach(id => {
    if (rest[id].nextNodeId === nodeId) {
      rest[id] = { ...rest[id], nextNodeId: undefined };
    }
    if (rest[id].choices) {
      rest[id] = {
        ...rest[id],
        choices: rest[id].choices!.map(c => 
          c.nextNodeId === nodeId ? { ...c, nextNodeId: '' } : c
        )
      };
    }
  });
  
  return { ...tree, nodes: rest };
}

