// src/components/ForgeStoryletGraphEditor/hooks/useFlowPathHighlighting.ts
import { useMemo } from 'react';
import type { ForgeGraphDoc, ForgeNode } from '@/src/types/forge/forge-graph';

export function useFlowPathHighlighting(selectedNodeId: string | null, graph: ForgeGraphDoc) {
  return useMemo(() => {
    const nodeDepths = new Map<string, number>();
    const edgesToSelectedNode = new Set<string>();

    const nodesById = new Map<string, ForgeNode>();
    for (const n of graph.flow.nodes) {
      const d = (n.data ?? {}) as ForgeNode;
      nodesById.set(n.id, d);
    }

    // adjacency from edges (primary)
    const outgoing = new Map<string, { to: string; edgeId?: string }[]>();
    const addOut = (from: string, to: string, edgeId?: string) => {
      if (!from || !to) return;
      const arr = outgoing.get(from) ?? [];
      arr.push({ to, edgeId });
      outgoing.set(from, arr);
    };

    for (const e of graph.flow.edges) addOut(e.source, e.target, e.id);

    // Also include semantic adjacency as fallback (in case edge missing)
    for (const [id, d] of nodesById.entries()) {
      if (d.defaultNextNodeId) addOut(id, d.defaultNextNodeId);
      d.choices?.forEach(c => { if (c.nextNodeId) addOut(id, c.nextNodeId); });
      d.conditionalBlocks?.forEach(b => { if (b.nextNodeId) addOut(id, b.nextNodeId); });
    }

    const start = graph.startNodeId;
    if (!start || !nodesById.has(start)) {
      return { nodeDepths, edgesToSelectedNode };
    }

    const parent = new Map<string, { prev: string; viaEdgeId?: string } | null>();
    const q: string[] = [];

    nodeDepths.set(start, 0);
    parent.set(start, null);
    q.push(start);

    while (q.length) {
      const cur = q.shift()!;
      const depth = nodeDepths.get(cur) ?? 0;
      for (const { to, edgeId } of outgoing.get(cur) ?? []) {
        if (!nodesById.has(to)) continue;
        if (nodeDepths.has(to)) continue;
        nodeDepths.set(to, depth + 1);
        parent.set(to, { prev: cur, viaEdgeId: edgeId });
        q.push(to);
      }
    }

    if (selectedNodeId && parent.has(selectedNodeId)) {
      let cur = selectedNodeId;
      while (true) {
        const p = parent.get(cur);
        if (!p) break;
        if (p.viaEdgeId) edgesToSelectedNode.add(p.viaEdgeId);
        cur = p.prev;
      }
    }

    return { nodeDepths, edgesToSelectedNode };
  }, [selectedNodeId, graph]);
}
