import type {
  ForgeGraphDoc,
  ForgeGraphKind,
  ForgeChoice,
  ForgeConditionalBlock,
  ForgeNode,
  ForgeNodeType,
  ForgeReactFlowJson,
  ForgeReactFlowNode,
} from '@magicborn/shared/types/forge-graph';
import { FORGE_CONDITIONAL_BLOCK_TYPE, FORGE_NODE_TYPE } from '@magicborn/shared/types/forge-graph';

/**
 * Create an empty ForgeGraphDoc with minimal valid structure.
 * Used for initializing default graphs when none exist.
 * Creates a truly empty graph with no nodes - the first node added will become the start node.
 */
export function createEmptyForgeGraphDoc(opts: {
  projectId: number;
  kind: ForgeGraphKind;
  title?: string;
  graphId?: number; // Optional ID for generating default title
}): ForgeGraphDoc {
  const now = new Date().toISOString();

  // Generate default title: "New Graph" + first 4 digits of ID (or timestamp if no ID)
  const generateDefaultTitle = () => {
    const idStr = opts.graphId ? String(opts.graphId) : String(Date.now());
    const firstFour = idStr.slice(0, 4);
    return `New Graph ${firstFour}`;
  };

  const defaultTitle = opts.title ?? generateDefaultTitle();

  const emptyFlow: ForgeReactFlowJson = {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };

  return {
    id: opts.graphId ?? 0, // Will be assigned by backend when created if 0
    project: opts.projectId,
    kind: opts.kind,
    title: defaultTitle,
    startNodeId: '', // Empty string for empty graphs - will be set when first node is added
    endNodeIds: [], // Empty array for empty graphs - will be set when first node is added
    flow: emptyFlow,
    compiledYarn: null,
    updatedAt: now,
    createdAt: now,
  };
}

export function createFlowNode(
  type: ForgeNodeType,
  id: string,
  x: number,
  y: number,
): ForgeReactFlowNode {
  const base: ForgeNode = {
    id,
    type,
    label: undefined,
    speaker: undefined,
    characterId: undefined,
    content: '',
    setFlags: undefined,
    choices: undefined,
    conditionalBlocks: undefined,
    storyletCall: undefined,
    actId: undefined,
    chapterId: undefined,
    pageId: undefined,
    defaultNextNodeId: undefined,
  };

  if (type === FORGE_NODE_TYPE.CHARACTER) {
    base.content = 'New dialogue...';
    base.speaker = 'Character';
  }

  if (type === FORGE_NODE_TYPE.PLAYER) {
    const choice: ForgeChoice = { id: `c_${Date.now()}`, text: 'Choice 1', nextNodeId: undefined };
    base.choices = [choice];
  }

  if (type === FORGE_NODE_TYPE.CONDITIONAL) {
    const block: ForgeConditionalBlock = {
      id: `block_${Date.now()}`,
      type: FORGE_CONDITIONAL_BLOCK_TYPE.IF,
      condition: [],
      content: '',
      speaker: undefined,
      characterId: undefined,
      nextNodeId: undefined,
      setFlags: undefined,
    };
    base.conditionalBlocks = [block];
  }

  return {
    id,
    type,
    position: { x, y },
    data: base,
  } as ForgeReactFlowNode;
}
