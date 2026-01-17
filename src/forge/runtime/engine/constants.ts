export const EXECUTION_MODE = {
  AUTO: 'AUTO',
  INTERACTIVE: 'INTERACTIVE',
} as const;

export type ExecutionMode = typeof EXECUTION_MODE[keyof typeof EXECUTION_MODE];

export const FRAME_KIND = {
  DIALOGUE: 'DIALOGUE',
  CHOICE: 'CHOICE',
  SYSTEM: 'SYSTEM',
  END: 'END',
} as const;

export type FrameKind = typeof FRAME_KIND[keyof typeof FRAME_KIND];

export const EXECUTION_STATUS = {
  COMPLETED: 'COMPLETED',
  WAITING_FOR_INPUT: 'WAITING_FOR_INPUT',
  HALTED: 'HALTED',
} as const;

export type ExecutionStatus = typeof EXECUTION_STATUS[keyof typeof EXECUTION_STATUS];

export const RUNTIME_DIRECTIVE_TYPE = {
  SCENE: 'SCENE',
  MEDIA: 'MEDIA',
  CAMERA: 'CAMERA',
} as const;

export type RuntimeDirectiveType = typeof RUNTIME_DIRECTIVE_TYPE[keyof typeof RUNTIME_DIRECTIVE_TYPE];
