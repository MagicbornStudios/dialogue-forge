/**
 * Detour Node Handler
 * 
 * Handles DETOUR nodes that reference other graphs with return capability.
 * Similar to storylet-handler but handles DETOUR_RETURN mode.
 */

import { BaseNodeHandler } from '@magicborn/forge/lib/yarn-converter/handlers/base-handler';
import { NodeBlockBuilder } from '@magicborn/forge/lib/yarn-converter/builders/node-block-builder';
import type { ForgeReactFlowNode, ForgeNodeType, ForgeGraphDoc, ForgeNode } from '@magicborn/forge/types/forge-graph';
import type { YarnConverterContext, YarnNodeBlock, YarnTextBuilder } from '@magicborn/forge/lib/yarn-converter/types';
import { FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';
import { defaultRegistry } from '@magicborn/forge/lib/yarn-converter/registry';
import { logRuntimeExportDiagnostics, prepareGraphForYarnExport } from '@magicborn/forge/lib/yarn-converter/utils/runtime-export';

export class DetourHandler extends BaseNodeHandler {
  canHandle(nodeType: ForgeNodeType): boolean {
    return nodeType === FORGE_NODE_TYPE.DETOUR;
  }

  async exportNode(
    node: ForgeReactFlowNode,
    builder: YarnTextBuilder,
    context?: YarnConverterContext
  ): Promise<string> {
    const data = this.getNodeData(node);
    
    if (!data.storyletCall) {
      // No storylet call - export as regular node
      const blockBuilder = new NodeBlockBuilder(node.id || 'unknown');
      blockBuilder.startNode();
      if (data.content) {
        blockBuilder.addContent(data.content, data.speaker);
      }
      return blockBuilder.endNode();
    }

    const targetGraphId = data.storyletCall.targetGraphId;
    const targetStartNodeId = data.storyletCall.targetStartNodeId;
    const returnNodeId = data.storyletCall.returnNodeId;
    const returnGraphId = data.storyletCall.returnGraphId;

    // Check for circular reference
    if (context?.visitedGraphs?.has(targetGraphId)) {
      console.warn(`Circular reference detected: graph ${targetGraphId} already visited`);
      // Export as a jump to the referenced graph's start node
      const blockBuilder = new NodeBlockBuilder(node.id || 'unknown');
      blockBuilder.startNode();
      blockBuilder.addContent(`[Detour: ${targetGraphId}]`, data.speaker);
      const startNodeId = targetStartNodeId || `detour_${targetGraphId}_start`;
      blockBuilder.addNextNode(startNodeId);
      return blockBuilder.endNode();
    }

    // Mark as visited
    context?.visitedGraphs?.add(targetGraphId);

    try {
      // Fetch referenced graph via workspace store (cache-first)
      let referencedGraph: ForgeGraphDoc | undefined;
      
      if (context?.getGraphFromCache) {
        referencedGraph = context.getGraphFromCache(String(targetGraphId));
      }
      
      if (!referencedGraph && context?.ensureGraph) {
        referencedGraph = await context.ensureGraph(String(targetGraphId));
      }

      if (!referencedGraph) {
        throw new Error(`Could not load referenced graph ${targetGraphId}`);
      }

      // Build the detour node with jump to referenced graph
      const blockBuilder = new NodeBlockBuilder(node.id || 'unknown');
      blockBuilder.startNode();
      
      // Add content if present
      if (data.content) {
        blockBuilder.addContent(data.content, data.speaker);
      }

      // Determine start node ID for jump
      const startNodeId = targetStartNodeId || referencedGraph.startNodeId;
      blockBuilder.addNextNode(startNodeId);

      const detourNodeText = blockBuilder.endNode();

      // Recursively export referenced graph's nodes
      const referencedNodesText = await this.exportReferencedGraph(
        referencedGraph,
        context,
        returnNodeId,
        returnGraphId
      );

      // Combine: detour node + inlined referenced graph nodes
      return detourNodeText + referencedNodesText;
    } catch (error) {
      console.error(`Failed to export detour node ${node.id}:`, error);
      // Fallback: export as simple jump node
      const blockBuilder = new NodeBlockBuilder(node.id || 'unknown');
      blockBuilder.startNode();
      blockBuilder.addContent(`[Detour: ${targetGraphId} - Error loading]`, data.speaker);
      return blockBuilder.endNode();
    } finally {
      // Remove from visited set after processing
      context?.visitedGraphs?.delete(targetGraphId);
    }
  }

  /**
   * Recursively export a referenced graph's nodes
   * 
   * For DETOUR_RETURN mode, we need to handle return nodes.
   * The referenced graph's end nodes should jump back to the return node.
   */
  private async exportReferencedGraph(
    graph: ForgeGraphDoc,
    context?: YarnConverterContext,
    returnNodeId?: string,
    returnGraphId?: number
  ): Promise<string> {
    let yarn = '';
    const { nodes: exportableNodes, diagnostics } = prepareGraphForYarnExport(graph);
    logRuntimeExportDiagnostics(graph, diagnostics);

    for (const node of exportableNodes) {
      if (!node.data?.type) continue;

      const handler = defaultRegistry.getHandler(node.data.type);
      const builder = this.createBuilder();
      
      let nodeText = await handler.exportNode(node, builder, context);

      // If this is an end node and we have a return node, modify the jump
      if (graph.endNodeIds.some(end => end.nodeId === node.id) && returnNodeId) {
        // Replace any final jumps with return jump
        // This is a simplified approach - in practice, we might need more sophisticated handling
        if (nodeText.includes('<<jump')) {
          // Find and replace the last jump
          const lines = nodeText.split('\n');
          let lastJumpIndex = -1;
          for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].includes('<<jump')) {
              lastJumpIndex = i;
              break;
            }
          }
          if (lastJumpIndex >= 0) {
            lines[lastJumpIndex] = `    <<jump ${returnNodeId}>>`;
            nodeText = lines.join('\n');
          }
        } else {
          // Add return jump if no jump present
          nodeText = nodeText.replace('===', `    <<jump ${returnNodeId}>>\n===`);
        }
      }

      yarn += nodeText;
    }

    return yarn;
  }

  async importNode(yarnBlock: YarnNodeBlock, context?: YarnConverterContext): Promise<ForgeReactFlowNode> {
    const lines = yarnBlock.lines;
    let content = '';
    let defaultNextNodeId: string | undefined;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const jumpMatch = trimmed.match(/<<jump\s+(\S+)>>/);
      if (jumpMatch) {
        defaultNextNodeId = jumpMatch[1];
      } else {
        content += (content ? '\n' : '') + trimmed;
      }
    }

    const nodeData: ForgeNode = {
      id: yarnBlock.nodeId,
      type: FORGE_NODE_TYPE.DETOUR,
      content: content.trim() || undefined,
      defaultNextNodeId,
    };

    return {
      id: yarnBlock.nodeId,
      type: FORGE_NODE_TYPE.DETOUR,
      position: { x: 0, y: 0 },
      data: nodeData,
    };
  }
}
