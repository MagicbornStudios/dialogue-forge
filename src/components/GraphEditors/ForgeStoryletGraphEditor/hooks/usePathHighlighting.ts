import { useMemo } from 'react';
import { ForgeGraph, Choice, ConditionalBlock } from '../../../../types';
import { createTreeHierarchy, findPath } from '../../../../utils/tree-navigation';

export function usePathHighlighting(
  selectedNodeId: string | null,
  dialogue: ForgeGraph | null
) {
  const { edgesToSelectedNode, nodeDepths } = useMemo(() => {
    if (!selectedNodeId || !dialogue || !dialogue.startNodeId) {
      return { edgesToSelectedNode: new Set<string>(), nodeDepths: new Map<string, number>() };
    }
    
    const hierarchy = createTreeHierarchy(dialogue);
    if (!hierarchy) {
      return { edgesToSelectedNode: new Set<string>(), nodeDepths: new Map<string, number>() };
    }
    
    const path = findPath(hierarchy, dialogue.startNodeId, selectedNodeId);
    if (!path) {
      return { edgesToSelectedNode: new Set<string>(), nodeDepths: new Map<string, number>() };
    }
    
    const edgesOnPath = new Set<string>();
    const nodeDepthMap = new Map<string, number>();
    
    for (let i = 0; i < path.length; i++) {
      const nodeId = path[i];
      nodeDepthMap.set(nodeId, i);
      
      if (i < path.length - 1) {
        const currentNode = dialogue.nodes[nodeId];
        const nextNodeId = path[i + 1];
        
        if (!currentNode) continue;
        
        if (currentNode.nextNodeId === nextNodeId) {
          edgesOnPath.add(`${nodeId}-next`);
        } else if (currentNode.choices) {
          currentNode.choices.forEach((choice: Choice, idx: number) => {
            if (choice.nextNodeId === nextNodeId) {
              edgesOnPath.add(`${nodeId}-choice-${idx}`);
            }
          });
        } else if (currentNode.conditionalBlocks) {
          currentNode.conditionalBlocks.forEach((block: ConditionalBlock, idx: number) => {
            if (block.nextNodeId === nextNodeId) {
              edgesOnPath.add(`${nodeId}-block-${idx}`);
            }
          });
        }
      }
    }
    
    return { edgesToSelectedNode: edgesOnPath, nodeDepths: nodeDepthMap };
  }, [selectedNodeId, dialogue]);

  return { edgesToSelectedNode, nodeDepths };
}
