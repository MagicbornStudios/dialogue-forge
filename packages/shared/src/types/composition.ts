import type {
  RuntimeDirectiveApplyMode,
  RuntimeDirectiveType,
} from '@magicborn/shared/types/runtime';

export const FORGE_COMPOSITION_SCHEMA = {
  V1: 'forge.composition.v1',
} as const;

export type ForgeCompositionSchema =
  typeof FORGE_COMPOSITION_SCHEMA[keyof typeof FORGE_COMPOSITION_SCHEMA];

export const COMPOSITION_TRACK_TYPE = {
  SYSTEM: 'SYSTEM',
  DIALOGUE: 'DIALOGUE',
  CHOICE: 'CHOICE',
  PRESENTATION: 'PRESENTATION',
} as const;

export type CompositionTrackType =
  typeof COMPOSITION_TRACK_TYPE[keyof typeof COMPOSITION_TRACK_TYPE];

export const COMPOSITION_CUE_TYPE = {
  ENTER_NODE: 'ENTER_NODE',
  LINE: 'LINE',
  CHOICES: 'CHOICES',
  SET_VARIABLES: 'SET_VARIABLES',
  DIRECTIVE: 'DIRECTIVE',
  END: 'END',
} as const;

export type CompositionCueType =
  typeof COMPOSITION_CUE_TYPE[keyof typeof COMPOSITION_CUE_TYPE];

export const COMPOSITION_TRANSITION = {
  CUT: 'CUT',
  FADE: 'FADE',
  SLIDE: 'SLIDE',
} as const;

export type CompositionTransition =
  typeof COMPOSITION_TRANSITION[keyof typeof COMPOSITION_TRANSITION];

export type CompositionTiming = {
  atMs: number;
  durationMs?: number;
  waitForInput?: boolean;
};

export type CompositionAnimationHint = {
  transition?: CompositionTransition;
  motionPreset?: string;
  // Frame-cycle runtime is deferred, but schema hooks are intentionally present.
  spriteSheet?: {
    imageId?: string | null;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    fps?: number;
  };
  frameCycle?: {
    enabled?: boolean;
    startFrame?: number;
    endFrame?: number;
    fps?: number;
    loop?: boolean;
  };
};

export type CompositionCondition = {
  flag: string;
  operator: string;
  value?: boolean | number | string;
};

export type CompositionChoice = {
  id: string;
  text: string;
  nextNodeId?: string;
  conditions?: CompositionCondition[];
  setFlags?: string[];
};

export type CompositionConditionalBlock = {
  id: string;
  type: string;
  condition?: CompositionCondition[];
  speaker?: string;
  characterId?: string;
  content?: string;
  nextNodeId?: string;
  setFlags?: string[];
};

export type CompositionStoryletCall = {
  mode: string;
  targetGraphId: number;
  targetStartNodeId?: string;
  returnNodeId?: string;
  returnGraphId?: number;
};

export type CompositionNodePresentation = {
  imageId?: string;
  backgroundId?: string;
  portraitId?: string;
};

export type CompositionRuntimeDirective = {
  type: RuntimeDirectiveType;
  refId?: string;
  payload?: Record<string, unknown>;
  applyMode?: RuntimeDirectiveApplyMode;
  priority?: number;
};

export type CompositionGraphNode = {
  id: string;
  type: string;
  label?: string;
  speaker?: string;
  characterId?: string;
  content?: string;
  setFlags?: string[];
  choices?: CompositionChoice[];
  conditionalBlocks?: CompositionConditionalBlock[];
  storyletCall?: CompositionStoryletCall;
  defaultNextNodeId?: string;
  presentation?: CompositionNodePresentation;
  runtimeDirectives?: CompositionRuntimeDirective[];
};

export type CompositionGraphEdge = {
  id: string;
  source: string;
  target: string;
  kind?: string;
  label?: string;
};

export type CompositionGraph = {
  graphId: number;
  kind: string;
  title: string;
  startNodeId: string;
  nodeOrder: string[];
  nodesById: Record<string, CompositionGraphNode>;
  edges: CompositionGraphEdge[];
};

export type CompositionScene = {
  id: string;
  graphId: number;
  title: string;
  nodeIds: string[];
};

export type CompositionTrack = {
  id: string;
  type: CompositionTrackType;
  cueIds: string[];
};

export type CompositionCharacterBinding = {
  characterId: string;
  displayName: string;
  portraitId?: string;
  slot?: 'left' | 'center' | 'right';
};

export type CompositionBackgroundBinding = {
  backgroundId: string;
  imageId?: string;
};

export type CompositionSetVariable = {
  name: string;
  value: boolean | number | string;
};

export type CompositionCue = {
  id: string;
  type: CompositionCueType;
  graphId: number;
  nodeId: string;
  trackId: string;
  timing: CompositionTiming;
  text?: string;
  speaker?: string;
  choices?: CompositionChoice[];
  setVariables?: CompositionSetVariable[];
  directive?: CompositionRuntimeDirective;
  animationHint?: CompositionAnimationHint;
};

export type CompositionDiagnosticLevel = 'info' | 'warning' | 'error';

export type CompositionDiagnostic = {
  level: CompositionDiagnosticLevel;
  code: string;
  message: string;
  graphId?: number;
  nodeId?: string;
  details?: Record<string, unknown>;
};

export type ForgeCompositionV1 = {
  schema: typeof FORGE_COMPOSITION_SCHEMA.V1;
  rootGraphId: number;
  entry: {
    graphId: number;
    nodeId: string;
  };
  resolvedGraphIds: number[];
  generatedAt: string;
  scenes: CompositionScene[];
  tracks: CompositionTrack[];
  cues: CompositionCue[];
  graphs: CompositionGraph[];
  characterBindings: CompositionCharacterBinding[];
  backgroundBindings: CompositionBackgroundBinding[];
  diagnostics: CompositionDiagnostic[];
};
