import type { StateCreator } from 'zustand';
import { createStore } from 'zustand/vanilla';

import type { DraftCollectionDelta, DraftDeltaIds } from '@/shared/types/draft';
import { createDraftSlice, type DraftSlice } from '@/shared/store/draft-slice';
import type { VideoLayer } from '@/video/templates/types/video-layer';
import type { VideoScene } from '@/video/templates/types/video-scene';
import type { VideoTemplate } from '@/video/templates/types/video-template';

const hasSameValue = <T,>(left: T, right: T): boolean => JSON.stringify(left) === JSON.stringify(right);

type EntityWithId = {
  id?: string | null;
};

const buildCollectionDelta = <TItem extends EntityWithId>(
  committed: TItem[],
  draft: TItem[]
): DraftCollectionDelta<TItem> => {
  const committedMap = new Map<string, TItem>();
  committed.forEach((item) => {
    if (item.id) {
      committedMap.set(item.id, item);
    }
  });

  const draftMap = new Map<string, TItem>();
  draft.forEach((item) => {
    if (item.id) {
      draftMap.set(item.id, item);
    }
  });

  const added: TItem[] = [];
  const updated: TItem[] = [];
  const removed: TItem[] = [];

  draftMap.forEach((draftItem, id) => {
    const committedItem = committedMap.get(id);
    if (!committedItem) {
      added.push(draftItem);
      return;
    }
    if (!hasSameValue(committedItem, draftItem)) {
      updated.push(draftItem);
    }
  });

  committedMap.forEach((committedItem, id) => {
    if (!draftMap.has(id)) {
      removed.push(committedItem);
    }
  });

  return { added, updated, removed };
};

const buildDeltaIds = <TItem extends EntityWithId>(delta: DraftCollectionDelta<TItem>): DraftDeltaIds => ({
  added: delta.added.map((item) => item.id ?? '').filter(Boolean),
  updated: delta.updated.map((item) => item.id ?? '').filter(Boolean),
  removed: delta.removed.map((item) => item.id ?? '').filter(Boolean),
});

const buildSceneMap = (scenes: VideoScene[]): Map<string, VideoScene> => {
  const map = new Map<string, VideoScene>();
  scenes.forEach((scene) => {
    if (scene.id) {
      map.set(scene.id, scene);
    }
  });
  return map;
};

export type VideoTemplateDraftDelta = {
  scenes: DraftCollectionDelta<VideoScene>;
  layersByScene: Record<string, DraftCollectionDelta<VideoLayer>>;
  sceneIds: DraftDeltaIds;
  layerIdsByScene: Record<string, DraftDeltaIds>;
};

export const calculateVideoTemplateDelta = (committed: VideoTemplate, draft: VideoTemplate): VideoTemplateDraftDelta => {
  const sceneDelta = buildCollectionDelta(committed.scenes, draft.scenes);
  const sceneIds = buildDeltaIds(sceneDelta);

  const committedSceneMap = buildSceneMap(committed.scenes);
  const draftSceneMap = buildSceneMap(draft.scenes);
  const layerIdsByScene: Record<string, DraftDeltaIds> = {};
  const layersByScene: Record<string, DraftCollectionDelta<VideoLayer>> = {};
  const allSceneIds = new Set<string>([...committedSceneMap.keys(), ...draftSceneMap.keys()]);

  allSceneIds.forEach((sceneId) => {
    const committedScene = committedSceneMap.get(sceneId);
    const draftScene = draftSceneMap.get(sceneId);
    const committedLayers = committedScene?.layers ?? [];
    const draftLayers = draftScene?.layers ?? [];
    const layerDelta = buildCollectionDelta(committedLayers, draftLayers);
    layersByScene[sceneId] = layerDelta;
    layerIdsByScene[sceneId] = buildDeltaIds(layerDelta);
  });

  return {
    scenes: sceneDelta,
    layersByScene,
    sceneIds,
    layerIdsByScene,
  };
};

export type VideoTemplateDraftSlice = DraftSlice<VideoTemplate, VideoTemplateDraftDelta, null> & {
  updateLayer: (
    layerId: string,
    updates: Partial<Pick<VideoLayer, 'startMs' | 'durationMs' | 'opacity'>>
  ) => void;
};

export function createVideoDraftSlice(
  set: Parameters<StateCreator<VideoTemplateDraftSlice, [], [], VideoTemplateDraftSlice>>[0],
  get: Parameters<StateCreator<VideoTemplateDraftSlice, [], [], VideoTemplateDraftSlice>>[1],
  initialTemplate?: VideoTemplate | null
): VideoTemplateDraftSlice {
  return {
    ...createDraftSlice<VideoTemplateDraftSlice, VideoTemplate, VideoTemplateDraftDelta, null>(set, get, {
      initialGraph: initialTemplate ?? null,
      calculateDelta: calculateVideoTemplateDelta,
    }),
    updateLayer: (layerId, updates) => {
      set((state) => {
        if (!state.draftGraph || !state.committedGraph) {
          return state;
        }
        const nextDraft: VideoTemplate = {
          ...state.draftGraph,
          scenes: state.draftGraph.scenes.map((scene) => {
            if (!scene.layers.some((layer) => layer.id === layerId)) {
              return scene;
            }
            return {
              ...scene,
              layers: scene.layers.map((layer) => (layer.id === layerId ? { ...layer, ...updates } : layer)),
            };
          }),
        };

        const nextDelta = calculateVideoTemplateDelta(state.committedGraph, nextDraft);

        return {
          draftGraph: nextDraft,
          deltas: [...state.deltas, nextDelta],
          hasUncommittedChanges: true,
        };
      });
    },
  };
}

export type VideoTemplateDraftStore = ReturnType<typeof createVideoDraftStore>;

export const createVideoDraftStore = (initialTemplate?: VideoTemplate | null) =>
  createStore<VideoTemplateDraftSlice>()((set, get) => ({
    ...createVideoDraftSlice(set, get, initialTemplate ?? null),
  }));
