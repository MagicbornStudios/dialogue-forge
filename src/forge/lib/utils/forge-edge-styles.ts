// src/utils/forge-edge-style.ts
import type { ForgeReactFlowEdge, ForgeReactFlowNode, ForgeNodeType } from '@/forge/types/forge-graph';

export const TYPE_COLORS: Record<ForgeNodeType, string> = {
  ACT: '#8b5cf6',
  CHAPTER: '#06b6d4',
  PAGE: '#22c55e',
  PLAYER: '#f59e0b',
  CHARACTER: '#e94560',
  CONDITIONAL: '#60a5fa',
  DETOUR: '#a78bfa',
  JUMP: '#f472b6',
  END: '#9ca3af',
  STORYLET: '#34d399',
};

export function edgeColorFor(
  edge: ForgeReactFlowEdge,
  sourceNode?: ForgeReactFlowNode
): string {
  // Check source node type from data if available
  if (sourceNode?.data?.type) {
    return TYPE_COLORS[sourceNode.data.type as ForgeNodeType] ?? '#9ca3af';
  }
  // Fallback: check sourceNode.type directly (for React Flow Node type)
  if (sourceNode?.type) {
    return TYPE_COLORS[sourceNode.type as ForgeNodeType] ?? '#9ca3af';
  }
  return '#9ca3af';
}

export function styleEdge(
  edge: ForgeReactFlowEdge,
  sourceNode: ForgeReactFlowNode | undefined,
  opts: { isInPath: boolean; isDimmed: boolean; isBackEdge: boolean }
): ForgeReactFlowEdge {
  const stroke = edgeColorFor(edge, sourceNode);
  const opacity = opts.isDimmed ? 0.15 : opts.isInPath ? 0.95 : 0.55;

  return {
    ...edge,
    style: {
      ...(edge.style ?? {}),
      stroke,
      strokeWidth: opts.isInPath ? 3 : 2,
      opacity,
      strokeDasharray: opts.isBackEdge ? '6 4' : undefined,
    },
  };
}
