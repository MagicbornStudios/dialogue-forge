import {
  RUNTIME_DIRECTIVE_APPLY_MODE,
  RUNTIME_DIRECTIVE_TYPE,
} from './constants';
import type {
  PresentationLayer,
  PresentationState,
  ResolvedRuntimeDirective,
  RuntimeDirectiveApplyMode,
} from './types';

const EMPTY_PRESENTATION_STATE: PresentationState = {
  background: undefined,
  portraits: {},
  overlays: {},
  audioCues: {},
};

const getDefaultApplyMode = (type: ResolvedRuntimeDirective['type']): RuntimeDirectiveApplyMode => {
  if (type === RUNTIME_DIRECTIVE_TYPE.AUDIO_CUE) {
    return RUNTIME_DIRECTIVE_APPLY_MODE.ON_ENTER;
  }

  return RUNTIME_DIRECTIVE_APPLY_MODE.PERSIST_UNTIL_CHANGED;
};

const getDirectiveKey = (directive: ResolvedRuntimeDirective, fallback: string): string => {
  const payload = directive.payload ?? {};
  const key = payload.slotId ?? payload.slot ?? payload.id ?? directive.refId;

  if (typeof key === 'string' && key.length > 0) {
    return key;
  }

  return fallback;
};

const toPriority = (directive: ResolvedRuntimeDirective): number => directive.priority ?? 0;

const buildLayer = (directive: ResolvedRuntimeDirective, key: string): PresentationLayer => ({
  key,
  directive,
  priority: toPriority(directive),
  applyMode: directive.applyMode ?? getDefaultApplyMode(directive.type),
});

const resolveLayerConflict = (
  existing: PresentationLayer | undefined,
  incoming: PresentationLayer,
): PresentationLayer => {
  if (!existing) {
    return incoming;
  }

  if (incoming.priority >= existing.priority) {
    return incoming;
  }

  return existing;
};

export const resolvePresentationState = (
  previous: PresentationState | undefined,
  directives?: ResolvedRuntimeDirective[],
): { frameState: PresentationState; persistentState: PresentationState } => {
  const base = previous ?? EMPTY_PRESENTATION_STATE;
  const persistentState: PresentationState = {
    background: base.background,
    portraits: { ...base.portraits },
    overlays: { ...base.overlays },
    audioCues: { ...base.audioCues },
  };
  const frameState: PresentationState = {
    background: persistentState.background,
    portraits: { ...persistentState.portraits },
    overlays: { ...persistentState.overlays },
    audioCues: { ...persistentState.audioCues },
  };

  if (!directives || directives.length === 0) {
    return { frameState, persistentState };
  }

  for (const directive of directives) {
    switch (directive.type) {
      case RUNTIME_DIRECTIVE_TYPE.BACKGROUND: {
        const layer = buildLayer(directive, 'background');
        frameState.background = resolveLayerConflict(frameState.background, layer);
        if (layer.applyMode === RUNTIME_DIRECTIVE_APPLY_MODE.PERSIST_UNTIL_CHANGED) {
          persistentState.background = resolveLayerConflict(persistentState.background, layer);
        }
        break;
      }
      case RUNTIME_DIRECTIVE_TYPE.PORTRAIT: {
        const key = getDirectiveKey(directive, 'portrait');
        const layer = buildLayer(directive, key);
        frameState.portraits = {
          ...frameState.portraits,
          [key]: resolveLayerConflict(frameState.portraits[key], layer),
        };
        if (layer.applyMode === RUNTIME_DIRECTIVE_APPLY_MODE.PERSIST_UNTIL_CHANGED) {
          persistentState.portraits = {
            ...persistentState.portraits,
            [key]: resolveLayerConflict(persistentState.portraits[key], layer),
          };
        }
        break;
      }
      case RUNTIME_DIRECTIVE_TYPE.OVERLAY: {
        const key = getDirectiveKey(directive, 'overlay');
        const layer = buildLayer(directive, key);
        frameState.overlays = {
          ...frameState.overlays,
          [key]: resolveLayerConflict(frameState.overlays[key], layer),
        };
        if (layer.applyMode === RUNTIME_DIRECTIVE_APPLY_MODE.PERSIST_UNTIL_CHANGED) {
          persistentState.overlays = {
            ...persistentState.overlays,
            [key]: resolveLayerConflict(persistentState.overlays[key], layer),
          };
        }
        break;
      }
      case RUNTIME_DIRECTIVE_TYPE.AUDIO_CUE: {
        const key = getDirectiveKey(directive, 'audio');
        const layer = buildLayer(directive, key);
        frameState.audioCues = {
          ...frameState.audioCues,
          [key]: resolveLayerConflict(frameState.audioCues[key], layer),
        };
        if (layer.applyMode === RUNTIME_DIRECTIVE_APPLY_MODE.PERSIST_UNTIL_CHANGED) {
          persistentState.audioCues = {
            ...persistentState.audioCues,
            [key]: resolveLayerConflict(persistentState.audioCues[key], layer),
          };
        }
        break;
      }
      default:
        break;
    }
  }

  return { frameState, persistentState };
};
