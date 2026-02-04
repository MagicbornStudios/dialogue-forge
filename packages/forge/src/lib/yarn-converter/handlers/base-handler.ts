/**
 * Base Node Handler
 * 
 * Abstract base class for node handlers.
 * Provides common utilities and defines the handler interface.
 */

import type { ForgeReactFlowNode, ForgeNodeType } from '@magicborn/forge/types/forge-graph';
import type { NodeHandler, YarnConverterContext, YarnNodeBlock, YarnTextBuilder } from '../types';
import { YarnTextBuilder as YarnTextBuilderImpl } from '../builders/yarn-text-builder';

/**
 * Abstract base class for node handlers
 * 
 * Provides common functionality and defines the interface that all
 * node type handlers must implement.
 */
export abstract class BaseNodeHandler implements NodeHandler {
  /**
   * Check if this handler can handle the given node type
   * Default implementation checks if nodeType matches handler's supported type
   */
  abstract canHandle(nodeType: ForgeNodeType): boolean;

  /**
   * Export a ForgeFlowNode to Yarn format
   * 
   * @param node - The node to export
   * @param builder - YarnTextBuilder for building Yarn text
   * @param context - Conversion context (for graph resolution)
   * @returns Promise that resolves to Yarn text for this node
   */
  abstract exportNode(
    node: ForgeReactFlowNode,
    builder: YarnTextBuilder,
    context?: YarnConverterContext
  ): Promise<string>;

  /**
   * Import a YarnNodeBlock to ForgeFlowNode
   * 
   * @param yarnBlock - Parsed Yarn node block
   * @param context - Conversion context
   * @returns Promise that resolves to ForgeFlowNode
   */
  abstract importNode(
    yarnBlock: YarnNodeBlock,
    context?: YarnConverterContext
  ): Promise<ForgeReactFlowNode>;

  /**
   * Create a new YarnTextBuilder instance
   * Helper method for handlers
   */
  protected createBuilder(): YarnTextBuilder {
    return new YarnTextBuilderImpl();
  }

  /**
   * Get node data safely
   * Helper method that ensures node.data exists
   */
  protected getNodeData(node: ForgeReactFlowNode) {
    if (!node.data) {
      throw new Error(`Node ${node.id} has no data`);
    }
    return node.data;
  }
}
