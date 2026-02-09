import type { ForgeGraphDoc } from '@magicborn/forge/types/forge-graph';
import type { CompositionDiagnostic } from '@magicborn/shared/types/composition';

export interface StoryletDetourResolverOptions {
  failOnMissingGraph?: boolean;
}

export interface StoryletDetourResolverResult {
  graphById: Map<number, ForgeGraphDoc>;
  resolvedGraphIds: number[];
  diagnostics: CompositionDiagnostic[];
}

function collectReferencedGraphIds(graph: ForgeGraphDoc): number[] {
  const referenced = new Set<number>();

  for (const node of graph.flow.nodes ?? []) {
    const targetGraphId = Number(node.data?.storyletCall?.targetGraphId);
    if (!Number.isFinite(targetGraphId) || targetGraphId <= 0) continue;
    referenced.add(targetGraphId);
  }

  return [...referenced];
}

export async function resolveStoryletDetourGraphs(
  rootGraph: ForgeGraphDoc,
  resolver: (graphId: number) => Promise<ForgeGraphDoc | null>,
  options: StoryletDetourResolverOptions = {}
): Promise<StoryletDetourResolverResult> {
  const failOnMissingGraph = options.failOnMissingGraph ?? true;
  const graphById = new Map<number, ForgeGraphDoc>();
  const diagnostics: CompositionDiagnostic[] = [];
  const queue: number[] = [rootGraph.id];
  const seen = new Set<number>();

  graphById.set(rootGraph.id, rootGraph);

  while (queue.length) {
    const graphId = queue.shift()!;
    if (seen.has(graphId)) continue;
    seen.add(graphId);

    const graph =
      graphId === rootGraph.id ? rootGraph : (await resolver(graphId)) ?? null;
    if (!graph) {
      const diagnostic: CompositionDiagnostic = {
        level: 'error',
        code: 'MISSING_REFERENCED_GRAPH',
        message: `Referenced graph ${graphId} could not be resolved`,
        graphId,
      };
      diagnostics.push(diagnostic);
      if (failOnMissingGraph) {
        const error = new Error(diagnostic.message);
        (error as Error & { code?: string }).code = diagnostic.code;
        throw error;
      }
      continue;
    }

    graphById.set(graph.id, graph);
    const referenced = collectReferencedGraphIds(graph);
    referenced.forEach((nextGraphId) => {
      if (!seen.has(nextGraphId)) queue.push(nextGraphId);
    });
  }

  return {
    graphById,
    resolvedGraphIds: [...graphById.keys()],
    diagnostics,
  };
}
