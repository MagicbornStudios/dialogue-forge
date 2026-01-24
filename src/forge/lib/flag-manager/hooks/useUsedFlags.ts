import { useMemo } from 'react';
import type { ForgeGraphDoc } from '@/forge/types/forge-graph';

/**
 * Hook to find all flags used in a graph
 */
export function useUsedFlags(graph: ForgeGraphDoc | undefined): Set<string> {
  return useMemo(() => {
    if (!graph) return new Set<string>();
    const used = new Set<string>();
    
    const nodes = graph.flow?.nodes ?? [];
    nodes.forEach(node => {
      if (node.data?.setFlags) {
        node.data.setFlags.forEach((flagId: string) => used.add(flagId));
      }
    });
    
    return used;
  }, [graph]);
}
