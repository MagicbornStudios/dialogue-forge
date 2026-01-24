import type { ForgeFlagValue, ForgeGameState } from '@/forge/types/forge-game-state';
import type { ForgeChoice, ForgeCondition, ForgeGraphDoc, ForgeNode } from '@/forge/types/forge-graph';
import type {
  ExecutionMode,
  ExecutionStatus,
  FrameKind,
  RuntimeDirectiveApplyMode,
  RuntimeDirectiveType,
} from './constants';

export type { RuntimeDirectiveApplyMode };

export type FlagMutation = {
  flagId: string;
  value: ForgeFlagValue;
};

export type RuntimeChoice = {
  id: string;
  text: string;
  nextNodeId?: string;
  mutations?: FlagMutation[];
};

export type RuntimeDirective = {
  type: RuntimeDirectiveType;
  refId?: string;
  payload?: Record<string, unknown>;
  applyMode?: RuntimeDirectiveApplyMode;
  priority?: number;
};

export type ResolvedRuntimeDirective = RuntimeDirective & {
  resolved?: unknown;
};

export type RuntimeDirectiveSource = {
  runtimeDirectives?: RuntimeDirective[];
};

export type FrameSource = {
  graphId: number;
  nodeId?: string;
  blockId?: string;
  choiceId?: string;
};

export type Frame = {
  id: string;
  kind: FrameKind;
  source: FrameSource;
  speaker?: string;
  content?: string;
  choices?: RuntimeChoice[];
  selectedChoiceId?: string;
  directives?: ResolvedRuntimeDirective[];
  presentation?: PresentationState;
  mutations?: FlagMutation[];
};

export type PresentationLayer = {
  key: string;
  directive: ResolvedRuntimeDirective;
  priority: number;
  applyMode: RuntimeDirectiveApplyMode;
};

export type PresentationState = {
  background?: PresentationLayer;
  portraits: Record<string, PresentationLayer>;
  overlays: Record<string, PresentationLayer>;
  audioCues: Record<string, PresentationLayer>;
};

export type ExecutionOptions = {
  mode?: ExecutionMode;
  maxSteps?: number;
  startingNodeId?: string;
  resolveGraph?: (graphId: number) => ForgeGraphDoc | null | Promise<ForgeGraphDoc | null>;
  resolveScene?: (sceneId: string) => unknown | Promise<unknown>;
  resolveMedia?: (mediaId: string) => unknown | Promise<unknown>;
  resolveCamera?: (cameraId: string) => unknown | Promise<unknown>;
  getRuntimeDirectives?: (node: ForgeNode) => RuntimeDirective[] | undefined;
};

export type PendingChoice = {
  graphId: number;
  nodeId: string;
  choices: RuntimeChoice[];
  rawChoices?: ForgeChoice[];
};

export type ExecutionResult = {
  frames: Frame[];
  state: ForgeGameState;
  status: ExecutionStatus;
  pendingChoice?: PendingChoice;
};

export type ConditionEvaluator = (conditions: ForgeCondition[], state: ForgeGameState) => boolean;
