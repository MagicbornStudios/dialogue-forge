export const TEMPLATE_INPUT_SCOPE = {
  NODE: 'node',
  GRAPH: 'graph',
  PROJECT: 'project',
} as const;

export type TemplateInputScope = typeof TEMPLATE_INPUT_SCOPE[keyof typeof TEMPLATE_INPUT_SCOPE];

export const buildTemplateInputKey = (scope: TemplateInputScope, key: string): string => `${scope}.${key}`;

export const buildNodeTemplateInputKey = (key: string): string => buildTemplateInputKey(TEMPLATE_INPUT_SCOPE.NODE, key);

export const TEMPLATE_INPUT_KEY = {
  NODE_BACKGROUND: buildNodeTemplateInputKey('background'),
  NODE_DIALOGUE: buildNodeTemplateInputKey('dialogue'),
  NODE_IMAGE: buildNodeTemplateInputKey('image'),
  NODE_SPEAKER: buildNodeTemplateInputKey('speaker'),
} as const;

export type TemplateInputKey = typeof TEMPLATE_INPUT_KEY[keyof typeof TEMPLATE_INPUT_KEY];
