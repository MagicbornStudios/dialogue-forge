import { useCallback } from 'react';
import { executeGraphToFrames } from '@/forge/runtime/execute-graph-to-frames';
import { EXECUTION_MODE, type ExecutionOptions, type ExecutionResult } from '@/forge/runtime/types';
import type { ForgeGraphDoc } from '@/forge/types/forge-graph';
import type { ForgeGameState } from '@/forge/types/forge-game-state';
import { GRAPH_SCOPE } from '@/forge/types/constants';
import type { VideoComposition } from '@/video/templates/types/video-composition';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import { compileCompositionFromFrames } from '@/video/templates/compile/compile-composition';
import { useForgeWorkspaceStore } from '../store/forge-workspace-store';

export type CompileCompositionJsonOptions = {
  graphId?: string;
  template: VideoTemplate;
  executionOptions?: ExecutionOptions;
};

const emptyGameState: ForgeGameState = { flags: {} };

export function useForgeWorkspaceCompositionCompiler() {
  const graphsById = useForgeWorkspaceStore((s) => s.graphs.byId);
  const graphScope = useForgeWorkspaceStore((s) => s.graphScope);
  const activeNarrativeGraphId = useForgeWorkspaceStore((s) => s.activeNarrativeGraphId);
  const activeStoryletGraphId = useForgeWorkspaceStore((s) => s.activeStoryletGraphId);
  const activeGameState = useForgeWorkspaceStore((s) => s.activeGameState);
  const dataAdapter = useForgeWorkspaceStore((s) => s.dataAdapter);

  const resolveGraph = useCallback(
    async (graphId: number): Promise<ForgeGraphDoc | null> => {
      const cached = graphsById[String(graphId)];
      if (cached) {
        return cached;
      }

      if (!dataAdapter) {
        return null;
      }

      return dataAdapter.getGraph(graphId);
    },
    [dataAdapter, graphsById],
  );

  const selectGraphId = useCallback(
    (graphId?: string) => {
      if (graphId) {
        return graphId;
      }

      return graphScope === GRAPH_SCOPE.NARRATIVE ? activeNarrativeGraphId : activeStoryletGraphId;
    },
    [activeNarrativeGraphId, activeStoryletGraphId, graphScope],
  );

  return useCallback(
    async ({ graphId, template, executionOptions }: CompileCompositionJsonOptions): Promise<{
      composition: VideoComposition;
      execution: ExecutionResult;
    } | null> => {
      const resolvedGraphId = selectGraphId(graphId);
      if (!resolvedGraphId) {
        return null;
      }

      const graph = graphsById[resolvedGraphId];
      if (!graph) {
        return null;
      }

      const execution = await executeGraphToFrames(graph, activeGameState ?? emptyGameState, {
        ...(executionOptions ?? {}),
        mode: EXECUTION_MODE.AUTO,
        resolveGraph,
      });

      const composition = compileCompositionFromFrames(template, execution.frames);

      return { composition, execution };
    },
    [activeGameState, graphsById, resolveGraph, selectGraphId],
  );
}
