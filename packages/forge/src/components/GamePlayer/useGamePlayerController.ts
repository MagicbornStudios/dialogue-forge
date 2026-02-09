import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ForgeCompositionV1,
  CompositionChoice,
} from '@magicborn/shared/types/composition';
import type {
  ForgeGraphDoc,
  ForgeNode,
  ForgeReactFlowEdge,
  ForgeReactFlowNode,
} from '@magicborn/forge/types/forge-graph';
import {
  createGraphRunner,
  RUNNER_STATUS,
  type GraphRunner,
  type GraphRunnerState,
} from '@magicborn/forge/lib/game-player/graph-runner';
import {
  RUNNER_EVENT_TYPE,
  type RunnerEvent,
} from '@magicborn/forge/lib/game-player/runner-events';

type ControllerLine = {
  graphId: number;
  nodeId: string;
  speaker?: string;
  characterId?: string;
  content: string;
};

function compositionToGraph(graph: ForgeCompositionV1['graphs'][number]): ForgeGraphDoc {
  const nodes: ForgeReactFlowNode[] = graph.nodeOrder.map((nodeId, index) => {
    const node = graph.nodesById[nodeId];
    const data: ForgeNode = {
      ...node,
      type: node.type as ForgeNode['type'],
      choices: node.choices?.map((choice) => ({
        id: choice.id,
        text: choice.text,
        nextNodeId: choice.nextNodeId,
        conditions: choice.conditions?.map((condition) => ({
          flag: condition.flag,
          operator: condition.operator as any,
          value: condition.value,
        })),
        setFlags: choice.setFlags,
      })),
      conditionalBlocks: node.conditionalBlocks?.map((block) => ({
        id: block.id,
        type: block.type as any,
        condition: block.condition?.map((condition) => ({
          flag: condition.flag,
          operator: condition.operator as any,
          value: condition.value,
        })),
        speaker: block.speaker,
        characterId: block.characterId,
        content: block.content,
        nextNodeId: block.nextNodeId,
        setFlags: block.setFlags,
      })),
      storyletCall: node.storyletCall
        ? {
            mode: node.storyletCall.mode as any,
            targetGraphId: node.storyletCall.targetGraphId,
            targetStartNodeId: node.storyletCall.targetStartNodeId,
            returnNodeId: node.storyletCall.returnNodeId,
            returnGraphId: node.storyletCall.returnGraphId,
          }
        : undefined,
      runtimeDirectives: node.runtimeDirectives?.map((directive) => ({
        type: directive.type,
        refId: directive.refId,
        payload: directive.payload,
        applyMode: directive.applyMode,
        priority: directive.priority,
      })),
    };

    return {
      id: nodeId,
      type: node.type,
      position: { x: 0, y: index * 140 },
      data,
    };
  });

  const edges: ForgeReactFlowEdge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    kind: edge.kind as any,
    label: edge.label,
    type: 'default',
  }));

  return {
    id: graph.graphId,
    project: 0,
    kind: graph.kind as any,
    title: graph.title,
    startNodeId: graph.startNodeId,
    endNodeIds: [],
    compiledYarn: null,
    flow: {
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 },
    },
  };
}

function toChoiceList(choices: CompositionChoice[]): {
  id: string;
  text: string;
  nextNodeId?: string;
}[] {
  return choices.map((choice) => ({
    id: choice.id,
    text: choice.text,
    nextNodeId: choice.nextNodeId,
  }));
}

export interface UseGamePlayerControllerInput {
  composition: ForgeCompositionV1 | null;
  gameState?: unknown;
}

export function useGamePlayerController({
  composition,
  gameState,
}: UseGamePlayerControllerInput) {
  const runnerRef = useRef<GraphRunner | null>(null);
  const [runnerState, setRunnerState] = useState<GraphRunnerState | null>(null);
  const [line, setLine] = useState<ControllerLine | null>(null);
  const [choices, setChoices] = useState<{ id: string; text: string; nextNodeId?: string }[]>(
    []
  );
  const [lastError, setLastError] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, boolean | number | string>>({});

  const applyEvents = useCallback((events: RunnerEvent[]) => {
    if (!runnerRef.current) return;
    for (const event of events) {
      if (event.type === RUNNER_EVENT_TYPE.LINE) {
        setLine({
          graphId: event.graphId,
          nodeId: event.nodeId,
          speaker: event.speaker,
          characterId: event.characterId,
          content: event.content,
        });
      }

      if (event.type === RUNNER_EVENT_TYPE.CHOICES) {
        setChoices(toChoiceList(event.choices));
      }

      if (event.type === RUNNER_EVENT_TYPE.SET_VARIABLES) {
        setVariables(runnerRef.current.getVariableSnapshot());
      }

      if (event.type === RUNNER_EVENT_TYPE.END) {
        setChoices([]);
      }

      if (event.type === RUNNER_EVENT_TYPE.ERROR) {
        setLastError(event.message);
      }
    }

    setRunnerState(runnerRef.current.getState());
    setVariables(runnerRef.current.getVariableSnapshot());
  }, []);

  useEffect(() => {
    if (!composition) {
      runnerRef.current = null;
      setRunnerState(null);
      setLine(null);
      setChoices([]);
      setLastError(null);
      setVariables({});
      return;
    }

    const graphById: Record<number, ForgeGraphDoc> = {};
    for (const graph of composition.graphs) {
      graphById[graph.graphId] = compositionToGraph(graph);
    }

    const rootGraph = graphById[composition.rootGraphId];
    if (!rootGraph) {
      setLastError(`Root graph ${composition.rootGraphId} not found in composition`);
      return;
    }

    const runner = createGraphRunner({
      rootGraph,
      graphsById: graphById,
      initialGameState: gameState,
    });
    runnerRef.current = runner;
    setLine(null);
    setChoices([]);
    setLastError(null);
    setVariables(runner.getVariableSnapshot());
    const events = runner.step();
    applyEvents(events);
  }, [applyEvents, composition, gameState]);

  const advance = useCallback(() => {
    if (!runnerRef.current) return;
    const events = runnerRef.current.advance();
    applyEvents(events);
  }, [applyEvents]);

  const selectChoice = useCallback(
    (choiceId: string) => {
      if (!runnerRef.current) return;
      const events = runnerRef.current.selectChoice(choiceId);
      applyEvents(events);
    },
    [applyEvents]
  );

  const restart = useCallback(() => {
    if (!runnerRef.current) return;
    const events = runnerRef.current.restart();
    setLine(null);
    setChoices([]);
    setLastError(null);
    applyEvents(events);
  }, [applyEvents]);

  const status = runnerState?.status ?? RUNNER_STATUS.IDLE;
  const isWaitingForAdvance = status === RUNNER_STATUS.WAITING_FOR_ADVANCE;
  const isWaitingForChoice = status === RUNNER_STATUS.WAITING_FOR_CHOICE;
  const isEnded = status === RUNNER_STATUS.ENDED;
  const isError = status === RUNNER_STATUS.ERROR;

  return useMemo(
    () => ({
      status,
      line,
      choices,
      lastError,
      variables,
      diagnostics: composition?.diagnostics ?? [],
      isWaitingForAdvance,
      isWaitingForChoice,
      isEnded,
      isError,
      advance,
      selectChoice,
      restart,
    }),
    [
      advance,
      choices,
      composition?.diagnostics,
      isEnded,
      isError,
      isWaitingForAdvance,
      isWaitingForChoice,
      lastError,
      line,
      restart,
      selectChoice,
      status,
      variables,
    ]
  );
}
