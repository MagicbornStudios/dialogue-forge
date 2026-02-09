import type { ForgeChoice, ForgeNode } from '@magicborn/forge/types/forge-graph';
import type { ForgeFlagValue } from '@magicborn/shared/types/forge-game-state';

export const RUNNER_EVENT_TYPE = {
  ENTER_NODE: 'ENTER_NODE',
  LINE: 'LINE',
  CHOICES: 'CHOICES',
  SET_VARIABLES: 'SET_VARIABLES',
  WAIT_FOR_USER: 'WAIT_FOR_USER',
  END: 'END',
  ERROR: 'ERROR',
} as const;

export type RunnerEventType = typeof RUNNER_EVENT_TYPE[keyof typeof RUNNER_EVENT_TYPE];

export type RunnerChoice = Pick<ForgeChoice, 'id' | 'text' | 'nextNodeId' | 'setFlags'>;

type RunnerEventBase = {
  type: RunnerEventType;
  graphId: number;
  nodeId: string;
  timestamp: number;
};

export type RunnerEnterNodeEvent = RunnerEventBase & {
  type: typeof RUNNER_EVENT_TYPE.ENTER_NODE;
  nodeType?: string;
};

export type RunnerLineEvent = RunnerEventBase & {
  type: typeof RUNNER_EVENT_TYPE.LINE;
  speaker?: string;
  characterId?: string;
  content: string;
  node: ForgeNode;
};

export type RunnerChoicesEvent = RunnerEventBase & {
  type: typeof RUNNER_EVENT_TYPE.CHOICES;
  choices: RunnerChoice[];
};

export type RunnerSetVariablesEvent = RunnerEventBase & {
  type: typeof RUNNER_EVENT_TYPE.SET_VARIABLES;
  updates: Record<string, ForgeFlagValue>;
};

export type RunnerWaitForUserEvent = RunnerEventBase & {
  type: typeof RUNNER_EVENT_TYPE.WAIT_FOR_USER;
  reason: 'advance' | 'choice';
};

export type RunnerEndEvent = RunnerEventBase & {
  type: typeof RUNNER_EVENT_TYPE.END;
};

export type RunnerErrorEvent = RunnerEventBase & {
  type: typeof RUNNER_EVENT_TYPE.ERROR;
  message: string;
  code?: string;
};

export type RunnerEvent =
  | RunnerEnterNodeEvent
  | RunnerLineEvent
  | RunnerChoicesEvent
  | RunnerSetVariablesEvent
  | RunnerWaitForUserEvent
  | RunnerEndEvent
  | RunnerErrorEvent;
