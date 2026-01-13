// src/utils/forge-flow-helpers.ts
import type { Connection } from 'reactflow';
import type {
  ForgeGraphDoc,
  ForgeFlowEdge,
  ForgeFlowNode,
  ForgeNode,
  ForgeNodeType,
  ForgeEdgeKind,
  ForgeChoice,
  ForgeConditionalBlock,
  ForgeGraphKind,
  ForgeFlowJson,
} from '@/src/types/forge/forge-graph';
import { 
  FORGE_CONDITIONAL_BLOCK_TYPE,
  FORGE_EDGE_KIND,
  FORGE_NODE_TYPE,
  FORGE_GRAPH_KIND,
} from '@/src/types/forge/forge-graph';

/**
 * Choice palette (used for Player/Conditional multi-branches)
 * Keep this consistent with your existing ChoiceEdge visuals.
 */
export const CHOICE_COLORS = ['#e94560', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'];

export type LayoutDirection = 'TB' | 'LR';

/**
 * NOTE:
 * Keep this as string-based, not ForgeNodeType-based.
 * ForgeNodeType differs between editors (storylet vs narrative subset),
 * and this helper is only used for visual/layout heuristics.
 */
const LINEAR_TYPES: ReadonlySet<string> = new Set<string>([
  FORGE_NODE_TYPE.CHARACTER,
  FORGE_NODE_TYPE.ACT,
  FORGE_NODE_TYPE.CHAPTER,
  FORGE_NODE_TYPE.PAGE,
  FORGE_NODE_TYPE.DETOUR,
  FORGE_NODE_TYPE.JUMP,
  FORGE_NODE_TYPE.STORYLET,
]);

export function isLinearNodeType(type?: string): boolean {
  return !!type && LINEAR_TYPES.has(type);
}

export function createFlowNode(
  type: ForgeNodeType,
  id: string,
  x: number,
  y: number,
): ForgeFlowNode {
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
    const c: ForgeChoice = { id: `c_${Date.now()}`, text: 'Choice 1', nextNodeId: undefined };
    base.choices = [c];
  }

  if (type === FORGE_NODE_TYPE.CONDITIONAL) {
    const b: ForgeConditionalBlock = {
      id: `block_${Date.now()}`,
      type: FORGE_CONDITIONAL_BLOCK_TYPE.IF,
      condition: [],
      content: '',
      speaker: undefined,
      characterId: undefined,
      nextNodeId: undefined,
      setFlags: undefined,
    };
    base.conditionalBlocks = [b];
  }

  return {
    id,
    type,
    position: { x, y },
    data: base,
  } as ForgeFlowNode;
}

export function addChoiceToNodeData(nodeData: ForgeNode): ForgeNode {
  if (nodeData.type !== 'PLAYER') return nodeData;
  const next: ForgeChoice = {
    id: `c_${Date.now()}`,
    text: 'New choice...',
    nextNodeId: undefined,
  };
  return {
    ...nodeData,
    choices: [...(nodeData.choices ?? []), next],
  };
}

export function updateChoiceInNodeData(
  nodeData: ForgeNode,
  choiceIdx: number,
  updates: Partial<ForgeChoice>
): ForgeNode {
  if (nodeData.type !== 'PLAYER') return nodeData;
  const choices = (nodeData.choices ?? []).slice();
  if (!choices[choiceIdx]) return nodeData;
  choices[choiceIdx] = { ...choices[choiceIdx], ...updates };
  return { ...nodeData, choices };
}

export function removeChoiceFromNodeData(nodeData: ForgeNode, choiceIdx: number): ForgeNode {
  if (nodeData.type !== 'PLAYER') return nodeData;
  const choices = (nodeData.choices ?? []).filter((_, i) => i !== choiceIdx);
  return { ...nodeData, choices };
}

export function upsertFlowNode(graph: ForgeGraphDoc, node: ForgeFlowNode): ForgeGraphDoc {
  const nodes = graph.flow.nodes.slice();
  const idx = nodes.findIndex(n => n.id === node.id);
  if (idx >= 0) nodes[idx] = node;
  else nodes.push(node);
  return { ...graph, flow: { ...graph.flow, nodes } };
}

export function updateFlowNodeData(graph: ForgeGraphDoc, nodeId: string, updates: Partial<ForgeNode>): ForgeGraphDoc {
  const nodes = graph.flow.nodes.map(n => {
    if (n.id !== nodeId) return n;
    const data = (n.data ?? {}) as ForgeNode;
    return { ...n, data: { ...data, ...updates, id: nodeId } };
  });
  return { ...graph, flow: { ...graph.flow, nodes } };
}

export function updateFlowNodePosition(graph: ForgeGraphDoc, nodeId: string, x: number, y: number): ForgeGraphDoc {
  const nodes = graph.flow.nodes.map(n => (n.id === nodeId ? { ...n, position: { x, y } } : n));
  return { ...graph, flow: { ...graph.flow, nodes } };
}

export function deleteFlowNode(graph: ForgeGraphDoc, nodeId: string): ForgeGraphDoc {
  if (nodeId === graph.startNodeId) throw new Error('Cannot delete the start node');

  const nodes = graph.flow.nodes.filter(n => n.id !== nodeId);
  const edges = graph.flow.edges.filter(e => e.source !== nodeId && e.target !== nodeId);

  // Remove semantic references to deleted node
  const cleanedNodes = nodes.map(n => {
    const d = { ...((n.data ?? {}) as ForgeNode) };
    if (d.defaultNextNodeId === nodeId) d.defaultNextNodeId = undefined;

    if (d.choices?.length) {
      d.choices = d.choices.map(c => (c.nextNodeId === nodeId ? { ...c, nextNodeId: undefined } : c));
    }
    if (d.conditionalBlocks?.length) {
      d.conditionalBlocks = d.conditionalBlocks.map(b => (b.nextNodeId === nodeId ? { ...b, nextNodeId: undefined } : b));
    }
    return { ...n, data: d };
  });

  return { ...graph, flow: { ...graph.flow, nodes: cleanedNodes, edges } };
}

/** Stable edge id so re-connect overwrites rather than duplicating. */
function buildEdgeId(source: string, target: string, sourceHandle?: string | null): string {
  return sourceHandle ? `e_${source}_${sourceHandle}_${target}` : `e_${source}_${target}`;
}

function inferKind(sourceHandle?: string | null): ForgeEdgeKind {
  if (!sourceHandle || sourceHandle === 'next' || sourceHandle === 'default') return FORGE_EDGE_KIND.FLOW;
  if (sourceHandle.startsWith('choice-')) return FORGE_EDGE_KIND.CHOICE;
  if (sourceHandle.startsWith('block-')) return FORGE_EDGE_KIND.CONDITION;
  return FORGE_EDGE_KIND.VISUAL;
}

function inferEdgeType(sourceHandle?: string | null): string {
  if (!sourceHandle || sourceHandle === 'next' || sourceHandle === 'default') return 'default';
  if (sourceHandle.startsWith('choice-')) return 'choice';
  if (sourceHandle.startsWith('block-')) return 'choice';
  return 'default';
}

function upsertEdge(edges: ForgeFlowEdge[], edge: ForgeFlowEdge): ForgeFlowEdge[] {
  const idx = edges.findIndex(e => e.id === edge.id);
  if (idx >= 0) {
    const copy = edges.slice();
    copy[idx] = edge;
    return copy;
  }
  return edges.concat(edge);
}

/**
 * Apply a React Flow connection:
 * - upsert edge in flow.edges (visual)
 * - write semantic nextNodeId into source node data
 */
export function applyConnection(graph: ForgeGraphDoc, connection: Connection): ForgeGraphDoc {
  if (!connection.source || !connection.target) return graph;

  const source = connection.source;
  const target = connection.target;
  const sourceHandle = connection.sourceHandle ?? null;

  // 1) visual edge
  const edgeId = buildEdgeId(source, target, sourceHandle);
  const nextEdge: ForgeFlowEdge = {
    id: edgeId,
    source,
    target,
    sourceHandle,
    targetHandle: connection.targetHandle ?? null,
    type: inferEdgeType(sourceHandle),
    kind: inferKind(sourceHandle),
  } as ForgeFlowEdge;

  let edges = upsertEdge(graph.flow.edges, nextEdge);

  // 2) semantic link
  const nodes = graph.flow.nodes.map(n => {
    if (n.id !== source) return n;
    const d = { ...((n.data ?? {}) as ForgeNode), id: source };

    // linear “next/default”
    if (!sourceHandle || sourceHandle === 'next' || sourceHandle === 'default') {
      d.defaultNextNodeId = target;
      return { ...n, data: d };
    }

    // player choice
    if (sourceHandle.startsWith('choice-')) {
      const idx = parseInt(sourceHandle.replace('choice-', ''), 10);
      if (!Number.isFinite(idx) || idx < 0) return { ...n, data: d };
      const choices = (d.choices ?? []).slice();
      if (!choices[idx]) return { ...n, data: d };
      choices[idx] = { ...choices[idx], nextNodeId: target };
      d.choices = choices;
      return { ...n, data: d };
    }

    // conditional block
    if (sourceHandle.startsWith('block-')) {
      const idx = parseInt(sourceHandle.replace('block-', ''), 10);
      if (!Number.isFinite(idx) || idx < 0) return { ...n, data: d };
      const blocks = (d.conditionalBlocks ?? []).slice();
      if (!blocks[idx]) return { ...n, data: d };
      blocks[idx] = { ...blocks[idx], nextNodeId: target };
      d.conditionalBlocks = blocks;
      return { ...n, data: d };
    }

    return { ...n, data: d };
  });

  return { ...graph, flow: { ...graph.flow, nodes, edges } };
}

/**
 * Remove an edge and clear matching semantic link on the source node.
 */
export function removeEdgeAndSemanticLink(graph: ForgeGraphDoc, edgeId: string): ForgeGraphDoc {
  const edge = graph.flow.edges.find(e => e.id === edgeId);
  if (!edge) return graph;

  const edges = graph.flow.edges.filter(e => e.id !== edgeId);

  const nodes = graph.flow.nodes.map(n => {
    if (n.id !== edge.source) return n;

    const d = { ...((n.data ?? {}) as ForgeNode), id: n.id };
    const h = edge.sourceHandle ?? null;

    if (!h || h === 'next' || h === 'default') {
      if (d.defaultNextNodeId === edge.target) d.defaultNextNodeId = undefined;
      return { ...n, data: d };
    }

    if (h.startsWith('choice-') && d.choices?.length) {
      const idx = parseInt(h.replace('choice-', ''), 10);
      if (Number.isFinite(idx) && d.choices[idx]?.nextNodeId === edge.target) {
        const choices = d.choices.slice();
        choices[idx] = { ...choices[idx], nextNodeId: undefined };
        d.choices = choices;
      }
      return { ...n, data: d };
    }

    if (h.startsWith('block-') && d.conditionalBlocks?.length) {
      const idx = parseInt(h.replace('block-', ''), 10);
      if (Number.isFinite(idx) && d.conditionalBlocks[idx]?.nextNodeId === edge.target) {
        const blocks = d.conditionalBlocks.slice();
        blocks[idx] = { ...blocks[idx], nextNodeId: undefined };
        d.conditionalBlocks = blocks;
      }
      return { ...n, data: d };
    }

    return { ...n, data: d };
  });

  return { ...graph, flow: { ...graph.flow, nodes, edges } };
}

/**
 * Insert a new node between an existing edge: source -> target becomes source -> new -> target.
 * This:
 * - removes old edge + semantic link
 * - creates new node
 * - applies two connections (preserving the original handle semantics for source -> new)
 * - uses 'next' for new -> target (linear default path)
 */
export function insertNodeBetweenEdge(
  graph: ForgeGraphDoc,
  edgeId: string,
  newNodeType: ForgeNodeType,
  newNodeId: string,
  x: number,
  y: number
): ForgeGraphDoc {
  const edge = graph.flow.edges.find(e => e.id === edgeId);
  if (!edge) return graph;

  let next = removeEdgeAndSemanticLink(graph, edgeId);

  // add new node
  const newNode = createFlowNode(newNodeType, newNodeId, x, y);
  next = upsertFlowNode(next, newNode);

  // connect source -> new (reuse original sourceHandle)
  next = applyConnection(next, {
    source: edge.source,
    target: newNodeId,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: null,
  });

  // connect new -> old target (linear next)
  next = applyConnection(next, {
    source: newNodeId,
    target: edge.target,
    sourceHandle: 'next',
    targetHandle: null,
  });

  return next;
}

/**
 * Utility to compute visual stroke color for a given edge.
 * - choice-/block- handles use CHOICE_COLORS[idx]
 * - otherwise use the source node type palette (matches your NPCEdgeV2 intent)
 */
export function edgeStrokeColor(edge: ForgeFlowEdge, sourceType?: string): string {
  const h = edge.sourceHandle ?? '';
  if (h.startsWith('choice-')) {
    const idx = parseInt(h.replace('choice-', ''), 10);
    return CHOICE_COLORS[(Number.isFinite(idx) ? idx : 0) % CHOICE_COLORS.length];
  }
  if (h.startsWith('block-')) {
    const idx = parseInt(h.replace('block-', ''), 10);
    return CHOICE_COLORS[(Number.isFinite(idx) ? idx : 0) % CHOICE_COLORS.length];
  }

  // Type palette aligned with your ForgeNodeType set
  const typePalette: Record<string, string> = {
    ACT: '#3B82F6',
    CHAPTER: '#10B981',
    PAGE: '#F59E0B',
    PLAYER: '#F59E0B',
    CHARACTER: '#E94560',
    CONDITIONAL: '#60A5FA',
    DETOUR: '#A78BFA',
    JUMP: '#F472B6',
    END: '#9CA3AF',
    STORYLET_REF: '#34D399',
  };

  return (sourceType && typePalette[sourceType]) ? typePalette[sourceType] : 'var(--color-df-edge-default)';
}

/**
 * Create an empty ForgeGraphDoc with minimal valid structure.
 * Used for initializing default graphs when none exist.
 */
export function createEmptyForgeGraphDoc(opts: {
  projectId: number
  kind: ForgeGraphKind
  title?: string
}): ForgeGraphDoc {
  const now = new Date().toISOString()
  const startNodeId = `start_${Date.now()}`
  
  const defaultTitle = opts.title ?? 
    (opts.kind === FORGE_GRAPH_KIND.NARRATIVE ? 'Untitled Narrative' : 'Untitled Storylet')
  
  const emptyFlow: ForgeFlowJson = {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  }
  
  return {
    id: 0, // Will be assigned by backend when created
    project: opts.projectId,
    kind: opts.kind,
    title: defaultTitle,
    startNodeId,
    endNodeIds: [],
    flow: emptyFlow,
    compiledYarn: null,
    updatedAt: now,
    createdAt: now,
  }
}
