import {
  FORGE_CONDITIONAL_BLOCK_TYPE,
  FORGE_NODE_TYPE,
  FORGE_STORYLET_CALL_MODE,
  type ForgeCondition,
  type ForgeGraphDoc,
  type ForgeNode,
  type ForgeReactFlowEdge,
} from '@magicborn/forge/types/forge-graph';
import { CONDITION_OPERATOR } from '@magicborn/forge/types/constants';
import type { ForgeFlagValue } from '@magicborn/shared/types/forge-game-state';
import {
  extractFlagsFromGameState,
  type FlattenConfig,
} from '@magicborn/forge/lib/game-player/game-state-flattener';
import {
  RUNNER_EVENT_TYPE,
  type RunnerChoice,
  type RunnerEndEvent,
  type RunnerErrorEvent,
  type RunnerEvent,
  type RunnerLineEvent,
  type RunnerSetVariablesEvent,
} from '@magicborn/forge/lib/game-player/runner-events';
import {
  createInMemoryVariableStorage,
  type VariableStorage,
} from '@magicborn/forge/lib/game-player/variable-storage';

export const RUNNER_STATUS = {
  IDLE: 'IDLE',
  WAITING_FOR_ADVANCE: 'WAITING_FOR_ADVANCE',
  WAITING_FOR_CHOICE: 'WAITING_FOR_CHOICE',
  ENDED: 'ENDED',
  ERROR: 'ERROR',
} as const;

export type RunnerStatus = typeof RUNNER_STATUS[keyof typeof RUNNER_STATUS];

type RunnerFrame = {
  graphId: number;
  nodeId: string | null;
};

type PendingAdvance = {
  nextGraphId: number;
  nextNodeId: string | null;
};

export interface GraphRunnerState {
  status: RunnerStatus;
  currentGraphId: number;
  currentNodeId: string | null;
  callStackDepth: number;
  waitingChoices: RunnerChoice[];
  pendingAdvance: PendingAdvance | null;
  lastError?: {
    message: string;
    code?: string;
  };
}

export interface GraphRunnerInput {
  rootGraph: ForgeGraphDoc;
  graphsById?: Record<number, ForgeGraphDoc>;
  graphResolver?: (graphId: number) => ForgeGraphDoc | null | undefined;
  variableStorage?: VariableStorage;
  initialGameState?: unknown;
  flattenConfig?: FlattenConfig;
  maxCallStackDepth?: number;
}

export interface GraphRunner {
  getState(): GraphRunnerState;
  step(): RunnerEvent[];
  advance(): RunnerEvent[];
  selectChoice(choiceId: string): RunnerEvent[];
  restart(next?: { graphId?: number; nodeId?: string }): RunnerEvent[];
  getVariableSnapshot(): Record<string, ForgeFlagValue>;
}

function now(): number {
  return Date.now();
}

function parseSetValue(raw: string): ForgeFlagValue {
  const trimmed = raw.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && trimmed.length > 0) return numeric;
  return trimmed.replace(/^['"]|['"]$/g, '');
}

function parseSetInstruction(
  instruction: string
): { name: string; value: ForgeFlagValue } | null {
  const equalsMatch = instruction.match(/^([A-Za-z0-9_.$-]+)\s*=\s*(.+)$/);
  if (equalsMatch) {
    return { name: equalsMatch[1], value: parseSetValue(equalsMatch[2]) };
  }

  const incrementMatch = instruction.match(/^([A-Za-z0-9_.$-]+)\s*\+=\s*(.+)$/);
  if (incrementMatch) {
    const delta = Number(parseSetValue(incrementMatch[2]));
    if (Number.isNaN(delta)) return null;
    return { name: incrementMatch[1], value: delta };
  }

  const trimmed = instruction.trim();
  if (!trimmed) return null;
  return { name: trimmed, value: true };
}

function evaluateCondition(
  condition: ForgeCondition,
  storage: VariableStorage
): boolean {
  const current = storage.get(condition.flag);
  const expected = condition.value;

  switch (condition.operator) {
    case CONDITION_OPERATOR.IS_SET:
      return Boolean(current);
    case CONDITION_OPERATOR.IS_NOT_SET:
      return !Boolean(current);
    case CONDITION_OPERATOR.EQUALS:
      return current === expected;
    case CONDITION_OPERATOR.NOT_EQUALS:
      return current !== expected;
    case CONDITION_OPERATOR.GREATER_THAN:
      return Number(current) > Number(expected);
    case CONDITION_OPERATOR.LESS_THAN:
      return Number(current) < Number(expected);
    case CONDITION_OPERATOR.GREATER_EQUAL:
      return Number(current) >= Number(expected);
    case CONDITION_OPERATOR.LESS_EQUAL:
      return Number(current) <= Number(expected);
    default:
      return false;
  }
}

function evaluateAllConditions(
  conditions: ForgeCondition[] | undefined,
  storage: VariableStorage
): boolean {
  if (!conditions?.length) return true;
  return conditions.every((condition) => evaluateCondition(condition, storage));
}

function findNode(graph: ForgeGraphDoc, nodeId: string): ForgeNode | null {
  const node = graph.flow.nodes.find((candidate) => candidate.id === nodeId);
  return (node?.data as ForgeNode | undefined) ?? null;
}

function findOutgoingEdges(graph: ForgeGraphDoc, nodeId: string): ForgeReactFlowEdge[] {
  return (graph.flow.edges ?? []).filter((edge) => edge.source === nodeId);
}

function resolveNextNodeId(graph: ForgeGraphDoc, nodeId: string, node: ForgeNode): string | null {
  if (node.defaultNextNodeId) return node.defaultNextNodeId;
  const outgoingEdges = findOutgoingEdges(graph, nodeId);
  if (!outgoingEdges.length) return null;
  return outgoingEdges[0].target ?? null;
}

function createRunnerEndEvent(graphId: number, nodeId: string): RunnerEndEvent {
  return {
    type: RUNNER_EVENT_TYPE.END,
    graphId,
    nodeId,
    timestamp: now(),
  };
}

function createRunnerErrorEvent(
  graphId: number,
  nodeId: string,
  message: string,
  code?: string
): RunnerErrorEvent {
  return {
    type: RUNNER_EVENT_TYPE.ERROR,
    graphId,
    nodeId,
    timestamp: now(),
    message,
    code,
  };
}

function isLineBearingNode(node: ForgeNode): boolean {
  return Boolean(node.content && node.content.trim().length > 0);
}

function pickConditionalBlock(node: ForgeNode, storage: VariableStorage) {
  const blocks = node.conditionalBlocks ?? [];
  for (const block of blocks) {
    if (block.type === FORGE_CONDITIONAL_BLOCK_TYPE.ELSE) return block;
    if (evaluateAllConditions(block.condition, storage)) return block;
  }
  return null;
}

function applySetFlags(
  graphId: number,
  nodeId: string,
  setFlags: string[] | undefined,
  storage: VariableStorage
): RunnerSetVariablesEvent | null {
  if (!setFlags?.length) return null;
  const updates: Record<string, ForgeFlagValue> = {};

  for (const instruction of setFlags) {
    const parsed = parseSetInstruction(instruction);
    if (!parsed) continue;

    const existing = storage.get(parsed.name);
    if (instruction.includes('+=')) {
      const currentNumeric = Number(existing ?? 0);
      const delta = Number(parsed.value);
      const nextValue = currentNumeric + delta;
      storage.set(parsed.name, nextValue);
      updates[parsed.name] = nextValue;
      continue;
    }

    storage.set(parsed.name, parsed.value);
    updates[parsed.name] = parsed.value;
  }

  if (!Object.keys(updates).length) return null;
  return {
    type: RUNNER_EVENT_TYPE.SET_VARIABLES,
    graphId,
    nodeId,
    timestamp: now(),
    updates,
  };
}

export function createGraphRunner(input: GraphRunnerInput): GraphRunner {
  const rootGraph = input.rootGraph;
  const graphIndex = new Map<number, ForgeGraphDoc>();
  graphIndex.set(rootGraph.id, rootGraph);

  Object.values(input.graphsById ?? {}).forEach((graph) => {
    graphIndex.set(graph.id, graph);
  });

  const maxCallStackDepth = input.maxCallStackDepth ?? 32;
  const flattenedInitialFlags = input.initialGameState
    ? extractFlagsFromGameState(input.initialGameState, {
        includeFalsyNumbers: true,
        ...input.flattenConfig,
      })
    : {};
  const storage =
    input.variableStorage ?? createInMemoryVariableStorage(flattenedInitialFlags);

  if (input.variableStorage && Object.keys(flattenedInitialFlags).length) {
    for (const [name, value] of Object.entries(flattenedInitialFlags)) {
      storage.set(name, value);
    }
  }

  let status: RunnerStatus = RUNNER_STATUS.IDLE;
  let currentGraphId = rootGraph.id;
  let currentNodeId: string | null = rootGraph.startNodeId || null;
  let waitingChoices: RunnerChoice[] = [];
  let pendingAdvance: PendingAdvance | null = null;
  let lastError: GraphRunnerState['lastError'];
  const callStack: RunnerFrame[] = [];

  const getGraph = (graphId: number): ForgeGraphDoc | null => {
    const inMemory = graphIndex.get(graphId);
    if (inMemory) return inMemory;
    const resolved = input.graphResolver?.(graphId);
    if (!resolved) return null;
    graphIndex.set(resolved.id, resolved);
    return resolved;
  };

  const setError = (
    message: string,
    code: string,
    graphId = currentGraphId,
    nodeId = currentNodeId ?? ''
  ) => {
    status = RUNNER_STATUS.ERROR;
    lastError = { message, code };
    return createRunnerErrorEvent(graphId, nodeId, message, code);
  };

  const popCallStack = (): { graphId: number; nodeId: string | null } | null => {
    const frame = callStack.pop();
    if (!frame) return null;
    return { graphId: frame.graphId, nodeId: frame.nodeId };
  };

  const drive = (): RunnerEvent[] => {
    const events: RunnerEvent[] = [];

    while (true) {
      if (status === RUNNER_STATUS.ENDED || status === RUNNER_STATUS.ERROR) {
        return events;
      }

      if (!currentNodeId) {
        const returnFrame = popCallStack();
        if (returnFrame) {
          currentGraphId = returnFrame.graphId;
          currentNodeId = returnFrame.nodeId;
          continue;
        }
        status = RUNNER_STATUS.ENDED;
        events.push(createRunnerEndEvent(currentGraphId, ''));
        return events;
      }

      const graph = getGraph(currentGraphId);
      if (!graph) {
        events.push(setError(`Graph ${currentGraphId} not found`, 'GRAPH_NOT_FOUND'));
        return events;
      }

      const node = findNode(graph, currentNodeId);
      if (!node) {
        events.push(
          setError(
            `Node ${currentNodeId} not found in graph ${currentGraphId}`,
            'NODE_NOT_FOUND'
          )
        );
        return events;
      }

      events.push({
        type: RUNNER_EVENT_TYPE.ENTER_NODE,
        graphId: currentGraphId,
        nodeId: currentNodeId,
        timestamp: now(),
        nodeType: node.type,
      });

      const nodeSetEvent = applySetFlags(
        currentGraphId,
        currentNodeId,
        node.setFlags,
        storage
      );
      if (nodeSetEvent) events.push(nodeSetEvent);

      if (node.type === FORGE_NODE_TYPE.END) {
        const returnFrame = popCallStack();
        if (returnFrame) {
          currentGraphId = returnFrame.graphId;
          currentNodeId = returnFrame.nodeId;
          continue;
        }
        status = RUNNER_STATUS.ENDED;
        events.push(createRunnerEndEvent(graph.id, currentNodeId));
        return events;
      }

      if (
        (node.type === FORGE_NODE_TYPE.STORYLET ||
          node.type === FORGE_NODE_TYPE.DETOUR) &&
        node.storyletCall
      ) {
        const targetGraphId = Number(node.storyletCall.targetGraphId);
        const targetGraph = getGraph(targetGraphId);
        if (!targetGraph) {
          events.push(
            setError(
              `Referenced graph ${targetGraphId} not found`,
              'MISSING_REFERENCED_GRAPH',
              currentGraphId,
              currentNodeId
            )
          );
          return events;
        }

        if (callStack.length >= maxCallStackDepth) {
          events.push(
            setError(
              `Call stack exceeded maximum depth ${maxCallStackDepth}`,
              'CALL_STACK_OVERFLOW',
              currentGraphId,
              currentNodeId
            )
          );
          return events;
        }

        const defaultReturnNodeId = resolveNextNodeId(graph, currentNodeId, node);
        if (node.storyletCall.mode === FORGE_STORYLET_CALL_MODE.DETOUR_RETURN) {
          callStack.push({
            graphId: node.storyletCall.returnGraphId ?? currentGraphId,
            nodeId: node.storyletCall.returnNodeId ?? defaultReturnNodeId,
          });
        }

        currentGraphId = targetGraph.id;
        currentNodeId = node.storyletCall.targetStartNodeId ?? targetGraph.startNodeId;
        continue;
      }

      if (node.type === FORGE_NODE_TYPE.CONDITIONAL) {
        const block = pickConditionalBlock(node, storage);
        const blockSetEvent = block
          ? applySetFlags(currentGraphId, currentNodeId, block.setFlags, storage)
          : null;
        if (blockSetEvent) events.push(blockSetEvent);

        if (block?.content && block.content.trim().length > 0) {
          const lineEvent: RunnerLineEvent = {
            type: RUNNER_EVENT_TYPE.LINE,
            graphId: currentGraphId,
            nodeId: currentNodeId,
            timestamp: now(),
            speaker: block.speaker,
            characterId: block.characterId,
            content: block.content,
            node,
          };
          events.push(lineEvent);
          events.push({
            type: RUNNER_EVENT_TYPE.WAIT_FOR_USER,
            graphId: currentGraphId,
            nodeId: currentNodeId,
            timestamp: now(),
            reason: 'advance',
          });
          pendingAdvance = {
            nextGraphId: currentGraphId,
            nextNodeId: block.nextNodeId ?? resolveNextNodeId(graph, currentNodeId, node),
          };
          status = RUNNER_STATUS.WAITING_FOR_ADVANCE;
          return events;
        }

        currentNodeId = block?.nextNodeId ?? resolveNextNodeId(graph, currentNodeId, node);
        continue;
      }

      if (node.type === FORGE_NODE_TYPE.PLAYER) {
        const visibleChoices = (node.choices ?? []).filter((choice) =>
          evaluateAllConditions(choice.conditions, storage)
        );
        waitingChoices = visibleChoices.map((choice) => ({
          id: choice.id,
          text: choice.text,
          nextNodeId: choice.nextNodeId,
          setFlags: choice.setFlags,
        }));
        events.push({
          type: RUNNER_EVENT_TYPE.CHOICES,
          graphId: currentGraphId,
          nodeId: currentNodeId,
          timestamp: now(),
          choices: waitingChoices,
        });
        events.push({
          type: RUNNER_EVENT_TYPE.WAIT_FOR_USER,
          graphId: currentGraphId,
          nodeId: currentNodeId,
          timestamp: now(),
          reason: 'choice',
        });
        status = RUNNER_STATUS.WAITING_FOR_CHOICE;
        return events;
      }

      if (isLineBearingNode(node)) {
        events.push({
          type: RUNNER_EVENT_TYPE.LINE,
          graphId: currentGraphId,
          nodeId: currentNodeId,
          timestamp: now(),
          speaker: node.speaker,
          characterId: node.characterId,
          content: node.content ?? '',
          node,
        });
        events.push({
          type: RUNNER_EVENT_TYPE.WAIT_FOR_USER,
          graphId: currentGraphId,
          nodeId: currentNodeId,
          timestamp: now(),
          reason: 'advance',
        });
        pendingAdvance = {
          nextGraphId: currentGraphId,
          nextNodeId: resolveNextNodeId(graph, currentNodeId, node),
        };
        status = RUNNER_STATUS.WAITING_FOR_ADVANCE;
        return events;
      }

      currentNodeId = resolveNextNodeId(graph, currentNodeId, node);
    }
  };

  const getState = (): GraphRunnerState => ({
    status,
    currentGraphId,
    currentNodeId,
    callStackDepth: callStack.length,
    waitingChoices,
    pendingAdvance,
    lastError,
  });

  return {
    getState,
    getVariableSnapshot: () => storage.snapshot(),
    step: () => {
      if (status === RUNNER_STATUS.WAITING_FOR_ADVANCE) return [];
      if (status === RUNNER_STATUS.WAITING_FOR_CHOICE) return [];
      if (status === RUNNER_STATUS.ENDED || status === RUNNER_STATUS.ERROR) return [];
      status = RUNNER_STATUS.IDLE;
      return drive();
    },
    advance: () => {
      if (status !== RUNNER_STATUS.WAITING_FOR_ADVANCE || !pendingAdvance) {
        return [];
      }
      currentGraphId = pendingAdvance.nextGraphId;
      currentNodeId = pendingAdvance.nextNodeId;
      pendingAdvance = null;
      status = RUNNER_STATUS.IDLE;
      return drive();
    },
    selectChoice: (choiceId: string) => {
      if (status !== RUNNER_STATUS.WAITING_FOR_CHOICE) return [];
      const selected = waitingChoices.find((choice) => choice.id === choiceId);
      if (!selected) {
        const error = setError(`Choice ${choiceId} is not available`, 'INVALID_CHOICE');
        return [error];
      }

      const events: RunnerEvent[] = [];
      const currentNode = currentNodeId ?? '';
      const setEvent = applySetFlags(
        currentGraphId,
        currentNode,
        selected.setFlags,
        storage
      );
      if (setEvent) events.push(setEvent);

      const currentGraph = getGraph(currentGraphId);
      const currentNodeData =
        currentGraph && currentNodeId ? findNode(currentGraph, currentNodeId) : null;
      const fallbackNext =
        currentGraph && currentNodeId && currentNodeData
          ? resolveNextNodeId(currentGraph, currentNodeId, currentNodeData)
          : null;
      currentNodeId = selected.nextNodeId ?? fallbackNext;
      waitingChoices = [];
      status = RUNNER_STATUS.IDLE;
      return [...events, ...drive()];
    },
    restart: (next) => {
      callStack.length = 0;
      waitingChoices = [];
      pendingAdvance = null;
      lastError = undefined;
      status = RUNNER_STATUS.IDLE;
      currentGraphId = next?.graphId ?? rootGraph.id;
      const restartGraph = getGraph(currentGraphId) ?? rootGraph;
      currentNodeId = next?.nodeId ?? restartGraph.startNodeId ?? null;
      return drive();
    },
  };
}
