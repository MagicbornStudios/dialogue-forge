/**
 * Canonical binding keys map runtime bindings to Forge graphs via dot-delimited scopes.
 *
 * - `node.*` keys map to data on individual graph nodes (e.g., node images, speakers).
 * - `graph.*` keys map to graph-level properties (e.g., background, template overrides).
 * - `media.*` keys map to media assets referenced by nodes or graphs.
 *
 * Prefer the builders below to avoid hard-coded string literals.
 */
export const BINDING_SCOPE = {
  NODE: 'node',
  GRAPH: 'graph',
  MEDIA: 'media',
} as const;

export type BindingScope = typeof BINDING_SCOPE[keyof typeof BINDING_SCOPE];

export const buildBindingKey = (scope: BindingScope, key: string): string => `${scope}.${key}`;

export const buildNodeBindingKey = (key: string): string => buildBindingKey(BINDING_SCOPE.NODE, key);
export const buildGraphBindingKey = (key: string): string => buildBindingKey(BINDING_SCOPE.GRAPH, key);
export const buildMediaBindingKey = (key: string): string => buildBindingKey(BINDING_SCOPE.MEDIA, key);

export const BINDING_KEY = {
  NODE_IMAGE: buildNodeBindingKey('image'),
  NODE_BACKGROUND: buildNodeBindingKey('background'),
  NODE_SPEAKER: buildNodeBindingKey('speaker'),
  NODE_TEMPLATE_OVERRIDE: buildNodeBindingKey('templateOverride'),
  GRAPH_BACKGROUND: buildGraphBindingKey('background'),
  GRAPH_TEMPLATE_OVERRIDE: buildGraphBindingKey('templateOverride'),
  MEDIA_IMAGE: buildMediaBindingKey('image'),
  MEDIA_VIDEO: buildMediaBindingKey('video'),
} as const;

export type BindingKey = typeof BINDING_KEY[keyof typeof BINDING_KEY];

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
