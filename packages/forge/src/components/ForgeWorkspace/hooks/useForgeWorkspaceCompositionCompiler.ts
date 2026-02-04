import { useCallback } from 'react';
import { executeGraphToFrames } from '@magicborn/runtime/execute-graph-to-frames';
import { EXECUTION_MODE, type ExecutionOptions, type ExecutionResult } from '@magicborn/runtime/types';
import type { ForgeGraphDoc } from '@magicborn/forge/types/forge-graph';
import type { ForgeGameState } from '@magicborn/shared/types/forge-game-state';
import { GRAPH_SCOPE } from '@magicborn/forge/types/constants';
import type { VideoComposition } from '@magicborn/video/templates/types/video-composition';
import type { VideoTemplate } from '@magicborn/video/templates/types/video-template';
import type { VideoTemplateOverrides } from '@magicborn/video/templates/types/video-template-overrides';
import { compileTemplateWithOverrides } from '@magicborn/video/templates/compile/compile-template-overrides';
import { useForgeWorkspaceStore } from '../store/forge-workspace-store';

export type CompileCompositionJsonOptions = {
  graphId?: string;
  template: VideoTemplate;
  executionOptions?: ExecutionOptions;
  overrides?: VideoTemplateOverrides;
};

const emptyGameState: ForgeGameState = { flags: {} };

export function useForgeWorkspaceCompositionCompiler() {
  const graphsById = useForgeWorkspaceStore((s) => s.graphs.byId);
  const graphScope = useForgeWorkspaceStore((s) => s.graphScope);
  const activeNarrativeGraphId = useForgeWorkspaceStore((s) => s.activeNarrativeGraphId);
  const activeStoryletGraphId = useForgeWorkspaceStore((s) => s.activeStoryletGraphId);
  const activeGameState = useForgeWorkspaceStore((s) => s.activeGameState);
  const dataAdapter = useForgeWorkspaceStore((s) => s.dataAdapter);
  const videoTemplateOverrides = useForgeWorkspaceStore((s) => s.videoTemplateOverrides);

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
    async ({ graphId, template, executionOptions, overrides }: CompileCompositionJsonOptions): Promise<{
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

      const { composition } = compileTemplateWithOverrides(template, {
        frames: execution.frames,
        overrides: overrides ?? videoTemplateOverrides,
      });

      return { composition, execution };
    },
    [activeGameState, graphsById, resolveGraph, selectGraphId, videoTemplateOverrides],
  );
}
