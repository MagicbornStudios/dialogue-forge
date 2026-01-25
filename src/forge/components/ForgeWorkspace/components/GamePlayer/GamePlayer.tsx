import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Player } from '@remotion/player';
import { executeGraphToFrames } from '@/forge/runtime/execute-graph-to-frames';
import {
  EXECUTION_MODE,
  EXECUTION_STATUS,
  FRAME_KIND,
  type ExecutionStatus,
  type FlagMutation,
  type Frame,
  type PendingChoice,
  type RuntimeChoice,
} from '@/forge/runtime/types';
import { FORGE_EDGE_KIND, type ForgeGraphDoc } from '@/forge/types/forge-graph';
import { FlagSchema } from '@/forge/types/flags';
import { DialogueResult, ForgeFlagState, type ForgeGameState } from '@/forge/types/forge-game-state';
import { VideoCompositionRenderer } from '@/video/player/VideoCompositionRenderer';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import type { VideoTemplateOverrides } from '@/video/templates/types/video-template-overrides';
import { compileTemplateWithOverrides } from '@/video/templates/compile/compile-template-overrides';
import { VNStage } from './VNStage';

export interface GamePlayerProps {
  dialogue: ForgeGraphDoc;
  startNodeId?: string;
  flagSchema?: FlagSchema;
  gameState?: ForgeGameState;
  gameStateFlags?: ForgeFlagState;
  videoTemplate?: VideoTemplate | null;
  videoTemplateOverrides?: VideoTemplateOverrides;
  onComplete?: (result: DialogueResult) => void;
  onFlagsChange?: (flags: ForgeFlagState) => void;
}

const applyMutations = (state: ForgeGameState, mutations?: FlagMutation[]): void => {
  if (!mutations) {
    return;
  }

  mutations.forEach((mutation) => {
    state.flags[mutation.flagId] = mutation.value;
  });
};

const sortEdges = (edges: Array<{ id?: string | null; target?: string | null }>) =>
  [...edges].sort((first, second) => {
    const targetCompare = (first.target ?? '').localeCompare(second.target ?? '');
    if (targetCompare !== 0) {
      return targetCompare;
    }

    return (first.id ?? '').localeCompare(second.id ?? '');
  });

const msToFrames = (ms: number, fps: number) => Math.max(1, Math.ceil((ms / 1000) * fps));

export function GamePlayer({
  dialogue,
  startNodeId,
  flagSchema,
  gameState,
  gameStateFlags,
  videoTemplate,
  videoTemplateOverrides,
  onComplete,
  onFlagsChange,
}: GamePlayerProps) {
  const resolvedGameState = useMemo<ForgeGameState>(() => {
    if (gameState) {
      return {
        ...gameState,
        flags: gameState.flags ?? {},
      };
    }
    return {
      flags: gameStateFlags ?? {},
    };
  }, [gameState, gameStateFlags]);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [pendingChoice, setPendingChoice] = useState<PendingChoice | undefined>();
  const [executionState, setExecutionState] = useState<ForgeGameState>({
    flags: resolvedGameState.flags,
  });
  const [status, setStatus] = useState<ExecutionStatus | undefined>();
  const composition = useMemo(() => {
    if (!videoTemplate || frames.length === 0) {
      return null;
    }

    const { composition: compiled } = compileTemplateWithOverrides(videoTemplate, {
      frames,
      overrides: videoTemplateOverrides,
    });

    return compiled;
  }, [frames, videoTemplate, videoTemplateOverrides]);
  const compositionDurationFrames = composition
    ? msToFrames(composition.durationMs, composition.frameRate)
    : 1;

  const graphIndex = useMemo(() => {
    const nodesById = new Map<string, ForgeGraphDoc['flow']['nodes'][number]>();
    const edgesBySource = new Map<string, ForgeGraphDoc['flow']['edges'][number][]>();

    dialogue.flow.nodes.forEach((node) => {
      if (node.id) {
        nodesById.set(node.id, node);
      }
    });

    dialogue.flow.edges.forEach((edge) => {
      if (!edge.source) {
        return;
      }

      const existing = edgesBySource.get(edge.source) ?? [];
      edgesBySource.set(edge.source, [...existing, edge]);
    });

    return { nodesById, edgesBySource };
  }, [dialogue]);

  const getDefaultNextNodeId = useCallback(
    (nodeId: string): string | undefined => {
      const nodeData = graphIndex.nodesById.get(nodeId)?.data;
      if (nodeData?.defaultNextNodeId) {
        return nodeData.defaultNextNodeId;
      }

      const outgoing = graphIndex.edgesBySource.get(nodeId) ?? [];
      if (outgoing.length === 0) {
        return undefined;
      }

      const flowEdges = outgoing.filter(
        (edge) =>
          edge.kind === FORGE_EDGE_KIND.FLOW ||
          edge.kind === FORGE_EDGE_KIND.DEFAULT ||
          edge.kind === FORGE_EDGE_KIND.CONDITION,
      );

      const candidates = flowEdges.length > 0 ? flowEdges : outgoing;
      return sortEdges(candidates)[0]?.target ?? undefined;
    },
    [graphIndex.edgesBySource, graphIndex.nodesById],
  );

  const runExecution = useCallback(
    async ({
      startingNodeId: nextNodeId,
      state,
      append,
    }: {
      startingNodeId?: string;
      state: ForgeGameState;
      append?: boolean;
    }) => {
      const execution = await executeGraphToFrames(dialogue, state, {
        mode: EXECUTION_MODE.INTERACTIVE,
        startingNodeId: nextNodeId,
      });

      setFrames((prev) => (append ? [...prev, ...execution.frames] : execution.frames));
      setPendingChoice(execution.pendingChoice);
      setExecutionState(execution.state);
      setStatus(execution.status);
      onFlagsChange?.(execution.state.flags);

      if (execution.status === EXECUTION_STATUS.COMPLETED) {
        onComplete?.({ updatedFlags: execution.state.flags });
      }
    },
    [dialogue, onComplete, onFlagsChange],
  );

  useEffect(() => {
    const initialState: ForgeGameState = {
      ...resolvedGameState,
      flags: { ...resolvedGameState.flags },
    };

    setFrames([]);
    setPendingChoice(undefined);
    setExecutionState(initialState);
    setStatus(undefined);

    void runExecution({
      startingNodeId: startNodeId,
      state: initialState,
    });
  }, [flagSchema, resolvedGameState, runExecution, startNodeId]);

  const handleChoiceSelect = useCallback(
    async (choice: RuntimeChoice) => {
      if (!pendingChoice) {
        return;
      }

      const nextState: ForgeGameState = {
        ...executionState,
        flags: { ...executionState.flags },
      };
      applyMutations(nextState, choice.mutations);

      const nextNodeId = choice.nextNodeId ?? getDefaultNextNodeId(pendingChoice.nodeId);
      if (!nextNodeId) {
        setPendingChoice(undefined);
        setStatus(EXECUTION_STATUS.COMPLETED);
        setExecutionState(nextState);
        onFlagsChange?.(nextState.flags);
        onComplete?.({ updatedFlags: nextState.flags });
        return;
      }

      await runExecution({
        startingNodeId: nextNodeId,
        state: nextState,
        append: true,
      });
    },
    [
      executionState,
      getDefaultNextNodeId,
      onComplete,
      onFlagsChange,
      pendingChoice,
      runExecution,
    ],
  );

  const activeFrame = frames[frames.length - 1];
  const frameSpeaker = activeFrame?.speaker;
  const frameContent = activeFrame?.content;
  const frameDirectives = activeFrame?.directives ?? [];
  const hasChoices = Boolean(pendingChoice?.choices?.length);
  const backgroundLabel =
    activeFrame?.presentation?.background?.directive?.refId ??
    activeFrame?.presentation?.background?.directive?.payload?.label ??
    '';
  const hasVideoTemplate = Boolean(videoTemplate);
  const hasVideoComposition = Boolean(composition && composition.durationMs > 0);

  return (
    <div className="relative border border-[#1a1a2e] rounded-3xl overflow-hidden bg-[#0f0f1a] h-full min-h-[480px] flex flex-col">
      <div className="relative flex-1 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="relative flex-1">
          <VNStage backgroundLabel={backgroundLabel} />
          <div className="absolute inset-x-6 bottom-6">
            <div className="backdrop-blur bg-black/60 border border-[#2a2a3e] rounded-2xl p-4 text-sm text-gray-200 shadow-lg">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-gray-400">
                <span>{frameSpeaker ?? 'Narrator'}</span>
                <span>{activeFrame?.kind ?? FRAME_KIND.DIALOGUE}</span>
              </div>
              <div className="mt-3 text-base text-white min-h-[64px]">
                {frameContent ?? (hasChoices ? 'Make a selection to continue.' : 'Awaiting dialogue...')}
              </div>
              {frameDirectives.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {frameDirectives.map((directive, index) => {
                    const label = directive.refId
                      ? `${directive.type}: ${directive.refId}`
                      : directive.type;

                    return (
                      <span
                        key={`${directive.type}-${directive.refId ?? index}`}
                        className="text-[10px] uppercase tracking-[0.2em] text-gray-300 bg-[#1a1a2e] border border-[#2a2a3e] px-2 py-1 rounded-full"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col border-t border-[#1a1a2e] bg-[#0b0b16] px-4 py-4 xl:border-t-0 xl:border-l">
          <div className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">Remotion Player</div>
          <div className="flex-1 flex items-center justify-center">
            {hasVideoTemplate && composition && hasVideoComposition ? (
              <Player
                component={VideoCompositionRenderer}
                durationInFrames={compositionDurationFrames}
                compositionWidth={composition.width}
                compositionHeight={composition.height}
                fps={composition.frameRate}
                inputProps={{ composition }}
                style={{ width: '100%', borderRadius: 16, overflow: 'hidden' }}
                controls
              />
            ) : (
              <div className="text-sm text-gray-500 text-center px-4">
                {hasVideoTemplate
                  ? 'Waiting for compiled composition frames...'
                  : 'Select a video template to preview the Remotion output.'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-[#1a1a2e] bg-[#0b0b16] px-6 py-4">
        <div className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">Choices</div>
        {hasChoices ? (
          <ul className="space-y-2">
            {pendingChoice?.choices.map((choice) => (
              <li key={choice.id}>
                <button
                  type="button"
                  onClick={() => handleChoiceSelect(choice)}
                  className="w-full text-left text-sm text-gray-200 border border-[#2a2a3e] rounded-xl px-4 py-2 hover:border-[#4f4f7a] hover:bg-[#141428] transition"
                >
                  {choice.text}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">
            {status === EXECUTION_STATUS.COMPLETED ? 'Dialogue complete.' : 'No choices available.'}
          </div>
        )}
      </div>
    </div>
  );
}
