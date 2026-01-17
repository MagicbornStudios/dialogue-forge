import { CONDITION_OPERATOR } from '@/src/forge/types/constants';
import {
  FORGE_CONDITIONAL_BLOCK_TYPE,
  FORGE_EDGE_KIND,
  FORGE_NODE_TYPE,
  type ForgeConditionalBlock,
  type ForgeGraphDoc,
  type ForgeNode,
  type ForgeReactFlowEdge,
  type ForgeReactFlowNode,
} from '@/src/forge/types/forge-graph';
import type { ForgeGameState } from '@/src/forge/types/forge-game-state';
import {
  EXECUTION_MODE,
  EXECUTION_STATUS,
  FRAME_KIND,
  RUNTIME_DIRECTIVE_TYPE,
} from './constants';
import type {
  ConditionEvaluator,
  ExecutionOptions,
  ExecutionResult,
  FlagMutation,
  Frame,
  PendingChoice,
  ResolvedRuntimeDirective,
  RuntimeChoice,
  RuntimeDirectiveSource,
} from './types';

const DEFAULT_MAX_STEPS = 1000;

const cloneState = (state: ForgeGameState): ForgeGameState => ({
  ...state,
  flags: { ...state.flags },
});

const evaluateConditions: ConditionEvaluator = (conditions, state) =>
  conditions.every((condition) => {
    const value = state.flags[condition.flag];

    switch (condition.operator) {
      case CONDITION_OPERATOR.IS_SET:
        return value !== undefined && value !== false;
      case CONDITION_OPERATOR.IS_NOT_SET:
        return value === undefined || value === false;
      case CONDITION_OPERATOR.EQUALS:
        return value === condition.value;
      case CONDITION_OPERATOR.NOT_EQUALS:
        return value !== condition.value;
      case CONDITION_OPERATOR.GREATER_THAN:
        return Number(value) > Number(condition.value);
      case CONDITION_OPERATOR.LESS_THAN:
        return Number(value) < Number(condition.value);
      case CONDITION_OPERATOR.GREATER_EQUAL:
        return Number(value) >= Number(condition.value);
      case CONDITION_OPERATOR.LESS_EQUAL:
        return Number(value) <= Number(condition.value);
      default:
        return false;
    }
  });

const toMutations = (setFlags?: string[]): FlagMutation[] | undefined => {
  if (!setFlags || setFlags.length === 0) {
    return undefined;
  }

  return setFlags.map((flag) => ({
    flagId: flag,
    value: true,
  }));
};

const applyMutations = (state: ForgeGameState, mutations?: FlagMutation[]): void => {
  if (!mutations) {
    return;
  }

  mutations.forEach((mutation) => {
    state.flags[mutation.flagId] = mutation.value;
  });
};

const getNodeType = (node: ForgeReactFlowNode): string | undefined =>
  node.data?.type ?? node.type;

const getOrderedEdges = (edges: ForgeReactFlowEdge[]): ForgeReactFlowEdge[] =>
  [...edges].sort((a, b) => {
    const targetCompare = (a.target ?? '').localeCompare(b.target ?? '');
    if (targetCompare !== 0) {
      return targetCompare;
    }

    return (a.id ?? '').localeCompare(b.id ?? '');
  });

const getDefaultNextNodeId = (
  nodeId: string,
  nodeData: ForgeNode | undefined,
  edgesBySource: Map<string, ForgeReactFlowEdge[]>,
): string | undefined => {
  if (nodeData?.defaultNextNodeId) {
    return nodeData.defaultNextNodeId;
  }

  const outgoing = edgesBySource.get(nodeId) ?? [];
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
  return getOrderedEdges(candidates)[0]?.target;
};

const resolveDirectives = async (
  node: ForgeNode,
  options: ExecutionOptions,
): Promise<ResolvedRuntimeDirective[] | undefined> => {
  const directiveSource = node as RuntimeDirectiveSource;
  const directives = options.getRuntimeDirectives?.(node) ?? directiveSource.runtimeDirectives;
  if (!directives || directives.length === 0) {
    return undefined;
  }

  const resolved: ResolvedRuntimeDirective[] = [];

  for (const directive of directives) {
    let resolvedValue: unknown;

    if (directive.refId) {
      if (directive.type === RUNTIME_DIRECTIVE_TYPE.SCENE) {
        resolvedValue = await options.resolveScene?.(directive.refId);
      }

      if (directive.type === RUNTIME_DIRECTIVE_TYPE.MEDIA) {
        resolvedValue = await options.resolveMedia?.(directive.refId);
      }

      if (directive.type === RUNTIME_DIRECTIVE_TYPE.CAMERA) {
        resolvedValue = await options.resolveCamera?.(directive.refId);
      }
    }

    resolved.push({
      ...directive,
      resolved: resolvedValue,
    });
  }

  return resolved.length > 0 ? resolved : undefined;
};

const buildChoiceMutations = (choiceFlags?: string[]): FlagMutation[] | undefined =>
  toMutations(choiceFlags);

const buildFrameId = (graphId: number, nodeId: string | undefined, step: number): string =>
  `${graphId}:${nodeId ?? 'unknown'}:${step}`;

export const executeGraphToFrames = async (
  graph: ForgeGraphDoc,
  initialState: ForgeGameState,
  options: ExecutionOptions = {},
): Promise<ExecutionResult> => {
  const mode = options.mode ?? EXECUTION_MODE.AUTO;
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
  const frames: Frame[] = [];
  const state = cloneState(initialState);

  const graphStack: Array<{ graph: ForgeGraphDoc; returnNodeId?: string }> = [];
  let currentGraph = graph;
  let currentNodeId = options.startingNodeId ?? graph.startNodeId;
  let steps = 0;

  const buildGraphIndex = (graphDoc: ForgeGraphDoc) => {
    const nodesById = new Map<string, ForgeReactFlowNode>();
    const edgesBySource = new Map<string, ForgeReactFlowEdge[]>();

    graphDoc.flow.nodes.forEach((node) => {
      if (node.id) {
        nodesById.set(node.id, node);
      }
    });

    graphDoc.flow.edges.forEach((edge) => {
      if (!edge.source) {
        return;
      }

      const existing = edgesBySource.get(edge.source) ?? [];
      edgesBySource.set(edge.source, [...existing, edge]);
    });

    return { nodesById, edgesBySource };
  };

  let graphIndex = buildGraphIndex(currentGraph);

  const isGraphEnd = (graphDoc: ForgeGraphDoc, nodeId: string | undefined): boolean => {
    if (!nodeId) {
      return true;
    }

    return graphDoc.endNodeIds.some((endNode) => endNode.nodeId === nodeId);
  };

  const resolveStorylet = async (nodeData: ForgeNode): Promise<boolean> => {
    if (!nodeData.storyletCall) {
      return false;
    }

    const targetGraph = await options.resolveGraph?.(nodeData.storyletCall.targetGraphId);
    if (!targetGraph) {
      return false;
    }

    graphStack.push({
      graph: currentGraph,
      returnNodeId: nodeData.storyletCall.returnNodeId ?? nodeData.defaultNextNodeId,
    });

    currentGraph = targetGraph;
    graphIndex = buildGraphIndex(currentGraph);
    currentNodeId = nodeData.storyletCall.targetStartNodeId ?? currentGraph.startNodeId;
    return true;
  };

  while (currentNodeId && steps < maxSteps) {
    const node = graphIndex.nodesById.get(currentNodeId);

    if (!node) {
      frames.push({
        id: buildFrameId(currentGraph.id, currentNodeId, steps),
        kind: FRAME_KIND.SYSTEM,
        source: { graphId: currentGraph.id, nodeId: currentNodeId },
        content: 'Missing node reference',
      });

      return {
        frames,
        state,
        status: EXECUTION_STATUS.HALTED,
      };
    }

    const nodeData = node.data ?? {};
    const nodeType = getNodeType(node);
    const directives = await resolveDirectives(nodeData, options);

    const nodeMutations = toMutations(nodeData.setFlags);
    applyMutations(state, nodeMutations);

    const baseSource = { graphId: currentGraph.id, nodeId: currentNodeId };

    if (nodeType === FORGE_NODE_TYPE.PLAYER) {
      const rawChoices = nodeData.choices ?? [];
      const availableChoices = rawChoices
        .filter((choice) => {
          if (!choice.conditions || choice.conditions.length === 0) {
            return true;
          }

          return evaluateConditions(choice.conditions, state);
        })
        .map<RuntimeChoice>((choice) => ({
          id: choice.id,
          text: choice.text,
          nextNodeId: choice.nextNodeId,
          mutations: buildChoiceMutations(choice.setFlags),
        }));

      if (availableChoices.length === 0) {
        frames.push({
          id: buildFrameId(currentGraph.id, currentNodeId, steps),
          kind: FRAME_KIND.SYSTEM,
          source: baseSource,
          directives,
          mutations: nodeMutations,
          content: 'No valid choices available',
        });

        return {
          frames,
          state,
          status: EXECUTION_STATUS.HALTED,
        };
      }

      if (mode === EXECUTION_MODE.INTERACTIVE) {
        const pendingChoice: PendingChoice = {
          graphId: currentGraph.id,
          nodeId: currentNodeId,
          choices: availableChoices,
          rawChoices,
        };

        frames.push({
          id: buildFrameId(currentGraph.id, currentNodeId, steps),
          kind: FRAME_KIND.CHOICE,
          source: baseSource,
          choices: availableChoices,
          directives,
          mutations: nodeMutations,
        });

        return {
          frames,
          state,
          status: EXECUTION_STATUS.WAITING_FOR_INPUT,
          pendingChoice,
        };
      }

      const selectedChoice = availableChoices[0];
      applyMutations(state, selectedChoice.mutations);
      const combinedMutations = [...(nodeMutations ?? []), ...(selectedChoice.mutations ?? [])];
      frames.push({
        id: buildFrameId(currentGraph.id, currentNodeId, steps),
        kind: FRAME_KIND.CHOICE,
        source: baseSource,
        choices: availableChoices,
        selectedChoiceId: selectedChoice.id,
        directives,
        mutations: combinedMutations.length > 0 ? combinedMutations : undefined,
      });

      currentNodeId = selectedChoice.nextNodeId ?? getDefaultNextNodeId(
        currentNodeId,
        nodeData,
        graphIndex.edgesBySource,
      );
      steps += 1;
      continue;
    }

    if (nodeType === FORGE_NODE_TYPE.CONDITIONAL) {
      const blocks = nodeData.conditionalBlocks ?? [];
      let matchedBlock: ForgeConditionalBlock | undefined;

      for (const block of blocks) {
        if (block.type === FORGE_CONDITIONAL_BLOCK_TYPE.ELSE) {
          matchedBlock = block;
          break;
        }

        if (!block.condition || block.condition.length === 0) {
          continue;
        }

        if (evaluateConditions(block.condition, state)) {
          matchedBlock = block;
          break;
        }
      }

      const blockMutations = toMutations(matchedBlock?.setFlags);
      const combinedMutations = [...(nodeMutations ?? []), ...(blockMutations ?? [])];
      applyMutations(state, blockMutations);

      if (matchedBlock?.content || matchedBlock?.speaker || blockMutations || directives) {
        frames.push({
          id: buildFrameId(currentGraph.id, currentNodeId, steps),
          kind: matchedBlock?.content || matchedBlock?.speaker ? FRAME_KIND.DIALOGUE : FRAME_KIND.SYSTEM,
          source: { ...baseSource, blockId: matchedBlock?.id },
          speaker: matchedBlock?.speaker,
          content: matchedBlock?.content,
          directives,
          mutations: combinedMutations.length > 0 ? combinedMutations : undefined,
        });
      }

      currentNodeId = matchedBlock?.nextNodeId ?? getDefaultNextNodeId(
        currentNodeId,
        nodeData,
        graphIndex.edgesBySource,
      );
      steps += 1;
      continue;
    }

    if (nodeData.storyletCall && options.resolveGraph) {
      frames.push({
        id: buildFrameId(currentGraph.id, currentNodeId, steps),
        kind: FRAME_KIND.SYSTEM,
        source: baseSource,
        directives,
        mutations: nodeMutations,
        content: 'Entering storylet',
      });

      const resolved = await resolveStorylet(nodeData);
      steps += 1;
      if (resolved) {
        continue;
      }
    }

    if (nodeData.content || nodeData.speaker) {
      frames.push({
        id: buildFrameId(currentGraph.id, currentNodeId, steps),
        kind: FRAME_KIND.DIALOGUE,
        source: baseSource,
        speaker: nodeData.speaker,
        content: nodeData.content,
        directives,
        mutations: nodeMutations,
      });
    } else if (nodeMutations || directives) {
      frames.push({
        id: buildFrameId(currentGraph.id, currentNodeId, steps),
        kind: FRAME_KIND.SYSTEM,
        source: baseSource,
        directives,
        mutations: nodeMutations,
      });
    }

    if (isGraphEnd(currentGraph, currentNodeId)) {
      if (graphStack.length === 0) {
        frames.push({
          id: buildFrameId(currentGraph.id, currentNodeId, steps + 1),
          kind: FRAME_KIND.END,
          source: baseSource,
        });

        return {
          frames,
          state,
          status: EXECUTION_STATUS.COMPLETED,
        };
      }

      const nextGraph = graphStack.pop();
      if (!nextGraph) {
        return {
          frames,
          state,
          status: EXECUTION_STATUS.HALTED,
        };
      }

      currentGraph = nextGraph.graph;
      graphIndex = buildGraphIndex(currentGraph);
      currentNodeId = nextGraph.returnNodeId ?? currentGraph.startNodeId;
      steps += 1;
      continue;
    }

    currentNodeId = getDefaultNextNodeId(currentNodeId, nodeData, graphIndex.edgesBySource);
    if (!currentNodeId && graphStack.length > 0) {
      const nextGraph = graphStack.pop();
      if (nextGraph) {
        currentGraph = nextGraph.graph;
        graphIndex = buildGraphIndex(currentGraph);
        currentNodeId = nextGraph.returnNodeId ?? currentGraph.startNodeId;
      }
    }
    steps += 1;
  }

  const status = steps >= maxSteps ? EXECUTION_STATUS.HALTED : EXECUTION_STATUS.COMPLETED;

  return {
    frames,
    state,
    status,
  };
};

export type {
  ExecutionOptions,
  ExecutionResult,
  Frame,
  PendingChoice,
  RuntimeDirective,
  RuntimeDirectiveSource,
} from './types';
