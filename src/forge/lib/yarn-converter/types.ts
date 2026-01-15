/**
 * Types and interfaces for Yarn Converter
 * 
 * Defines the core types used throughout the yarn converter system.
 */

import type { ForgeGraphDoc, ForgeReactFlowNode, ForgeNodeType } from '@/forge/types/forge-graph';
import type { ForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';

/**
 * Context for yarn conversion operations
 * 
 * Provides access to workspace store for graph resolution (cache-first pattern).
 * Tracks visited graphs to prevent circular references when inlining storylet/detour nodes.
 */
export interface YarnConverterContext {
  /**
   * Optional workspace store for graph resolution
   * If provided, uses cache-first resolver pattern
   */
  workspaceStore?: ForgeWorkspaceStore;
  
  /**
   * Get graph from cache (if available)
   * Falls back to workspace store cache if workspaceStore provided
   */
  getGraphFromCache?: (graphId: string) => ForgeGraphDoc | undefined;
  
  /**
   * Ensure graph is loaded (checks cache first, then fetches via adapter)
   * Uses workspace store's ensureGraph action if workspaceStore provided
   */
  ensureGraph?: (graphId: string) => Promise<ForgeGraphDoc>;
  
  /**
   * Track visited graphs to prevent circular references
   * When inlining storylet/detour nodes, we track which graphs we've already processed
   */
  visitedGraphs?: Set<number>;
}

/**
 * Parsed Yarn node block structure
 * 
 * Represents a single node block parsed from Yarn format:
 * ```
 * title: NodeName
 * ---
 * content here
 * ===
 * ```
 */
export interface YarnNodeBlock {
  /** Node ID from title: line */
  nodeId: string;
  
  /** All lines of content between --- and === */
  lines: string[];
  
  /** Raw block text */
  rawContent: string;
}

/**
 * Node handler interface
 * 
 * Each node type implements this interface to handle export/import
 * of that specific node type to/from Yarn format.
 */
export interface NodeHandler {
  /**
   * Check if this handler can handle the given node type
   */
  canHandle(nodeType: ForgeNodeType): boolean;
  
  /**
   * Export a ForgeFlowNode to Yarn format
   * 
   * @param node - The node to export
   * @param builder - YarnTextBuilder for building Yarn text
   * @param context - Conversion context (for graph resolution)
   * @returns Promise that resolves to Yarn text for this node
   */
  exportNode(
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
  importNode(
    yarnBlock: YarnNodeBlock,
    context?: YarnConverterContext
  ): Promise<ForgeReactFlowNode>;
}

/**
 * YarnTextBuilder interface
 * 
 * Provides transparent Yarn text generation with clear formatting methods.
 * See builders/yarn-text-builder.ts for implementation.
 */
export interface YarnTextBuilder {
  addNodeTitle(nodeId: string): YarnTextBuilder;
  addNodeSeparator(): YarnTextBuilder;
  addLine(content: string, speaker?: string): YarnTextBuilder;
  addOption(choiceText: string, indent?: number): YarnTextBuilder;
  addCommand(command: string, args?: string): YarnTextBuilder;
  addConditionalBlock(type: 'if' | 'elseif' | 'else', condition?: string): YarnTextBuilder;
  addEndConditional(): YarnTextBuilder;
  addJump(targetNodeId: string, indent?: number): YarnTextBuilder;
  addSetCommand(flag: string, value?: any, indent?: number): YarnTextBuilder;
  build(): string;
  clear(): void;
}
