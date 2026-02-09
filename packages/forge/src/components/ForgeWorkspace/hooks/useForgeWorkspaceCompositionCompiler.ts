import { useCallback } from 'react';
import type { ForgeGraphDoc } from '@magicborn/forge/types/forge-graph';
import type { ForgeCompositionV1 } from '@magicborn/shared/types/composition';
import { graphToComposition } from '@magicborn/forge/lib/game-player/composition/graph-to-composition';

export type CompileCompositionJsonOptions = {
  graph?: ForgeGraphDoc;
  graphId?: string;
  template: unknown;
  executionOptions?: unknown;
  overrides?: unknown;
  resolver?: (graphId: number) => Promise<ForgeGraphDoc | null>;
  resolveStorylets?: boolean;
};

export function useForgeWorkspaceCompositionCompiler() {
  return useCallback(
    async (options: CompileCompositionJsonOptions): Promise<ForgeCompositionV1 | null> => {
      if (!options.graph) return null;
      const result = await graphToComposition(options.graph, {
        resolver: options.resolver,
        resolveStorylets: options.resolveStorylets,
      });
      return result.composition;
    },
    [],
  );
}
