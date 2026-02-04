/**
 * Yarn Converter - Main Entry Point
 * 
 * Provides async exportToYarn and importFromYarn functions using the
 * extensible handler pattern. Integrates with workspace store for
 * graph resolution when available.
 */

import type { ForgeGraphDoc, ForgeReactFlowNode } from '@magicborn/forge/types/forge-graph';
import { FORGE_GRAPH_KIND } from '@magicborn/forge/types/forge-graph';
import type { YarnConverterContext, YarnNodeBlock } from '@magicborn/forge/lib/yarn-converter/types';
import { defaultRegistry } from '@magicborn/forge/lib/yarn-converter/registry';
import { YarnTextBuilder } from '@magicborn/forge/lib/yarn-converter/builders/yarn-text-builder';
import { createMinimalContext } from '@magicborn/forge/lib/yarn-converter/workspace-context';

// Import and register handlers
import { CharacterHandler } from '@magicborn/forge/lib/yarn-converter/handlers/character-handler';
import { PlayerHandler } from '@magicborn/forge/lib/yarn-converter/handlers/player-handler';
import { ConditionalHandler } from '@magicborn/forge/lib/yarn-converter/handlers/conditional-handler';
import { StoryletHandler } from '@magicborn/forge/lib/yarn-converter/handlers/storylet-handler';
import { DetourHandler } from '@magicborn/forge/lib/yarn-converter/handlers/detour-handler';
import { FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';
import { YARN_SYNTAX } from '@magicborn/forge/lib/yarn-converter/builders/yarn-text-builder';
import { logRuntimeExportDiagnostics, prepareGraphForYarnExport } from '@magicborn/forge/lib/yarn-converter/utils/runtime-export';

// Register all handlers
const characterHandler = new CharacterHandler();
const playerHandler = new PlayerHandler();
const conditionalHandler = new ConditionalHandler();
const storyletHandler = new StoryletHandler();
const detourHandler = new DetourHandler();

defaultRegistry.registerHandler(FORGE_NODE_TYPE.CHARACTER, characterHandler);
defaultRegistry.registerHandler(FORGE_NODE_TYPE.PLAYER, playerHandler);
defaultRegistry.registerHandler(FORGE_NODE_TYPE.CONDITIONAL, conditionalHandler);
defaultRegistry.registerHandler(FORGE_NODE_TYPE.STORYLET, storyletHandler);
defaultRegistry.registerHandler(FORGE_NODE_TYPE.DETOUR, detourHandler);

/**
 * Export ForgeGraphDoc to Yarn Spinner format
 * 
 * Converts a ForgeGraphDoc to Yarn Spinner .yarn file format.
 * Uses the handler registry to delegate to appropriate node handlers.
 * 
 * @param graph - The ForgeGraphDoc to export
 * @param context - Optional conversion context (for workspace store integration)
 * @returns Promise that resolves to Yarn format string
 */
export async function exportToYarn(
  graph: ForgeGraphDoc,
  context?: YarnConverterContext
): Promise<string> {
  // Use provided context or create minimal one
  const conversionContext = context || createMinimalContext();

  let yarn = '';
  const { nodes: exportableNodes, diagnostics } = prepareGraphForYarnExport(graph);
  logRuntimeExportDiagnostics(graph, diagnostics);

  // Export each node
  for (const node of exportableNodes) {
    if (!node.data?.type) {
      console.warn(`Node ${node.id} has no type, skipping`);
      continue;
    }

    try {
      const handler = defaultRegistry.getHandler(node.data.type);
      const builder = new YarnTextBuilder();
      
      const nodeText = await handler.exportNode(node, builder, conversionContext);
      yarn += nodeText;
    } catch (error) {
      console.error(`Failed to export node ${node.id}:`, error);
      // Continue with other nodes
    }
  }

  return yarn;
}

/**
 * Parse Yarn Spinner format to ForgeGraphDoc
 * 
 * Converts a Yarn Spinner .yarn file to ForgeGraphDoc format.
 * Uses the handler registry to delegate to appropriate node handlers.
 * 
 * @param yarnContent - Yarn format string
 * @param title - Optional title for the graph
 * @param context - Optional conversion context
 * @returns Promise that resolves to ForgeGraphDoc
 */
export async function importFromYarn(
  yarnContent: string,
  title: string = 'Imported Dialogue',
  context?: YarnConverterContext
): Promise<ForgeGraphDoc> {
  // Parse Yarn content into node blocks
  const nodeBlocks = parseYarnContent(yarnContent);
  const nodes: ForgeReactFlowNode[] = [];

  // Import each node block
  for (const block of nodeBlocks) {
    try {
      // Determine node type from content
      const nodeType = determineNodeTypeFromYarn(block);
      
      if (!nodeType) {
        console.warn(`Could not determine node type for block ${block.nodeId}, skipping`);
        continue;
      }

      const handler = defaultRegistry.getHandler(nodeType);
      const node = await handler.importNode(block, context);
      nodes.push(node);
    } catch (error) {
      console.error(`Failed to import node ${block.nodeId}:`, error);
      // Continue with other nodes
    }
  }

  const startNodeId = nodes[0]?.id || 'start';

  return {
    id: 0, // Will be assigned by backend
    project: 0, // Will be assigned by backend
    kind: FORGE_GRAPH_KIND.STORYLET, // Default to storylet
    title,
    startNodeId,
    endNodeIds: [],
    flow: {
      nodes,
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
    compiledYarn: null,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Parse Yarn content into node blocks
 */
function parseYarnContent(yarnContent: string): YarnNodeBlock[] {
  const blocks: YarnNodeBlock[] = [];
  const nodeBlocks = yarnContent.split('===').filter(b => b.trim());

  nodeBlocks.forEach(block => {
    const titleMatch = block.match(/title:\s*(\S+)/);
    if (!titleMatch) return;

    const nodeId = titleMatch[1];
    const contentStart = block.indexOf('---');
    if (contentStart === -1) return;

    const content = block.slice(contentStart + 3).trim();
    const lines = content.split('\n').filter(l => l.trim());

    blocks.push({
      nodeId,
      lines,
      rawContent: content,
    });
  });

  return blocks;
}

/**
 * Determine node type from Yarn block content
 * 
 * Heuristics:
 * - Has "-> " lines = PLAYER
 * - Has "<<if" blocks = CONDITIONAL or CHARACTER with conditionals
 * - Otherwise = CHARACTER
 */
function determineNodeTypeFromYarn(
  block: YarnNodeBlock
): (typeof FORGE_NODE_TYPE)[keyof typeof FORGE_NODE_TYPE] | null {
  const hasOptions = block.lines.some(line => line.trim().startsWith('-> '));
  const hasConditionals = block.lines.some(line => 
    line.includes(YARN_SYNTAX.IF_COMMAND) || line.includes(YARN_SYNTAX.ELSEIF_COMMAND) || line.includes(YARN_SYNTAX.ELSE_COMMAND)
  );

  if (hasOptions) {
    return FORGE_NODE_TYPE.PLAYER;
  }

  if (hasConditionals && !hasOptions) {
    // Could be CONDITIONAL or CHARACTER with conditionals
    // For now, assume CONDITIONAL if it's mostly conditionals
    const conditionalLines = block.lines.filter(line => 
      line.includes(YARN_SYNTAX.IF_COMMAND) || line.includes(YARN_SYNTAX.ELSEIF_COMMAND) || line.includes(YARN_SYNTAX.ELSE_COMMAND) || line.includes(YARN_SYNTAX.ENDIF_COMMAND)
    );
    if (conditionalLines.length > block.lines.length / 2) {
      return FORGE_NODE_TYPE.CONDITIONAL;
    }
  }

  // Default to CHARACTER
  return FORGE_NODE_TYPE.CHARACTER;
}

/**
 * Yarn block type constants for Yarn syntax generation
 */
export const CONDITION_BLOCK_TYPE = {
  IF: 'if',
  ELSEIF: 'elseif',
  ELSE: 'else',
  ENDIF: 'endif',
} as const;

export type ConditionBlockType = typeof CONDITION_BLOCK_TYPE[keyof typeof CONDITION_BLOCK_TYPE];


// Re-export types and utilities for convenience
export type { YarnConverterContext } from './types';
export { createWorkspaceContext, createMinimalContext } from './workspace-context';
export { defaultRegistry } from './registry';
export { YarnTextBuilder } from './builders/yarn-text-builder';
export { NodeBlockBuilder } from './builders/node-block-builder';
