/**
 * Storylet Node Handler
 * 
 * Handles STORYLET nodes that reference other graphs.
 * Fetches referenced graphs via workspace store (cache-first) and inlines them.
 */

import { BaseNodeHandler } from '@magicborn/forge/lib/yarn-converter/handlers/base-handler';
import { NodeBlockBuilder } from '@magicborn/forge/lib/yarn-converter/builders/node-block-builder';
import type { ForgeReactFlowNode, ForgeNodeType, ForgeGraphDoc } from '@magicborn/forge/types/forge-graph';
import type { YarnConverterContext, YarnNodeBlock, YarnTextBuilder } from '@magicborn/forge/lib/yarn-converter/types';
import { FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';
import { defaultRegistry } from '@magicborn/forge/lib/yarn-converter/registry';
import { logRuntimeExportDiagnostics, prepareGraphForYarnExport } from '@magicborn/forge/lib/yarn-converter/utils/runtime-export';

export class StoryletHandler extends BaseNodeHandler {
  canHandle(nodeType: ForgeNodeType): boolean {
    return nodeType === FORGE_NODE_TYPE.STORYLET;
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

    // Check for circular reference
    if (context?.visitedGraphs?.has(targetGraphId)) {
      console.warn(`Circular reference detected: graph ${targetGraphId} already visited`);
      // Export as a jump to the referenced graph's start node
      const blockBuilder = new NodeBlockBuilder(node.id || 'unknown');
      blockBuilder.startNode();
      blockBuilder.addContent(`[Storylet: ${targetGraphId}]`, data.speaker);
      const startNodeId = targetStartNodeId || `storylet_${targetGraphId}_start`;
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

      // Build the storylet node with jump to referenced graph
      const blockBuilder = new NodeBlockBuilder(node.id || 'unknown');
      blockBuilder.startNode();
      
      // Add content if present
      if (data.content) {
        blockBuilder.addContent(data.content, data.speaker);
      }

      // Determine start node ID for jump
      const startNodeId = targetStartNodeId || referencedGraph.startNodeId;
      blockBuilder.addNextNode(startNodeId);

      const storyletNodeText = blockBuilder.endNode();

      // Recursively export referenced graph's nodes
      const referencedNodesText = await this.exportReferencedGraph(
        referencedGraph,
        context
      );

      // Combine: storylet node + inlined referenced graph nodes
      return storyletNodeText + referencedNodesText;
    } catch (error) {
      console.error(`Failed to export storylet node ${node.id}:`, error);
      // Fallback: export as simple jump node
      const blockBuilder = new NodeBlockBuilder(node.id || 'unknown');
      blockBuilder.startNode();
      blockBuilder.addContent(`[Storylet: ${targetGraphId} - Error loading]`, data.speaker);
      return blockBuilder.endNode();
    } finally {
      // Remove from visited set after processing
      context?.visitedGraphs?.delete(targetGraphId);
    }
  }

  /**
   * Recursively export a referenced graph's nodes
   * 
   * Inlines all nodes from the referenced graph into the current Yarn file.
   */
  private async exportReferencedGraph(
    graph: ForgeGraphDoc,
    context?: YarnConverterContext
  ): Promise<string> {
    let yarn = '';
    const { nodes: exportableNodes, diagnostics } = prepareGraphForYarnExport(graph);
    logRuntimeExportDiagnostics(graph, diagnostics);

    for (const node of exportableNodes) {
      if (!node.data?.type) continue;

      const handler = defaultRegistry.getHandler(node.data.type);
      const builder = this.createBuilder();
      
      const nodeText = await handler.exportNode(node, builder, context);
      yarn += nodeText;
    }

    return yarn;
  }

  async importNode(yarnBlock: YarnNodeBlock, context?: YarnConverterContext): Promise<ForgeReactFlowNode> {
    // This will be implemented when we refactor importFromYarn
    throw new Error('StoryletHandler.importNode not yet implemented');
  }
}
