import type { VideoLayer } from '@/video/templates/types/video-layer';
import type { VideoScene } from '@/video/templates/types/video-scene';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import type { VideoTemplateWorkspaceAdapter } from './video-template-workspace-contracts';
import type { VideoTemplateMediaRequest, VideoTemplateMediaResolution } from './video-template-workspace-contracts';
import { VIDEO_MEDIA_KIND } from './video-template-workspace-contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import type { DraftDeltaIds } from '@/shared/types/draft';
import { SceneList } from './components/SceneList';
import { LayerList } from './components/LayerList';
import { LayerInspector } from './components/LayerInspector';
import { Preview } from './components/Preview';
import { Timeline } from './components/Timeline';
import { calculateVideoTemplateDelta, createVideoDraftStore } from './store/video-draft-slice';
import { cn } from '@/shared/lib/utils';
import { BINDING_KEY } from '@/shared/types/bindings';
import * as React from 'react';
import { useStore } from 'zustand';

interface VideoTemplateWorkspaceProps {
  className?: string;
  template?: VideoTemplate | null;
  scenes?: VideoScene[];
  layers?: VideoLayer[];
  activeSceneId?: string;
  activeLayerId?: string;
  isPlaying?: boolean;
  adapter?: VideoTemplateWorkspaceAdapter;
  onSelectScene?: (sceneId: string) => void;
  onSelectLayer?: (layerId: string) => void;
  onAddScene?: () => void;
  onDuplicateScene?: (sceneId: string) => void;
  onDeleteScene?: (sceneId: string) => void;
  onAddLayer?: () => void;
  onDeleteLayer?: (layerId: string) => void;
  onUpdateLayerStart?: (layerId: string, startMs: number) => void;
  onUpdateLayerDuration?: (layerId: string, durationMs: number) => void;
  onUpdateLayerOpacity?: (layerId: string, opacity: number) => void;
  onUpdateTemplateMetadata?: (metadata: Partial<Pick<VideoTemplate, 'name' | 'width' | 'height' | 'frameRate'>>) => void;
  onTogglePlayback?: () => void;
  onSaveTemplate?: () => void;
  saveDisabled?: boolean;
  headerNotice?: string;
}

export function VideoTemplateWorkspace({
  className,
  template,
  scenes,
  layers,
  activeSceneId,
  activeLayerId,
  isPlaying,
  adapter,
  onSelectScene,
  onSelectLayer,
  onAddScene,
  onAddLayer,
  onUpdateLayerStart,
  onUpdateLayerDuration,
  onUpdateLayerOpacity,
  onTogglePlayback,
  onSaveTemplate,
  saveDisabled,
  headerNotice,
}: VideoTemplateWorkspaceProps) {
  const draftStoreRef = React.useRef<ReturnType<typeof createVideoDraftStore> | null>(null);
  if (!draftStoreRef.current) {
    draftStoreRef.current = createVideoDraftStore(template ?? null);
  }
  const draftStore = draftStoreRef.current;

  const draftTemplate = useStore(draftStore, (state) => state.draftGraph);
  const committedTemplate = useStore(draftStore, (state) => state.committedGraph);
  const hasUncommittedChanges = useStore(draftStore, (state) => state.hasUncommittedChanges);

  React.useEffect(() => {
    const currentState = draftStore.getState();
    if (!template) {
      if (currentState.committedGraph) {
        currentState.resetDraft(null);
      }
      return;
    }
    const committed = currentState.committedGraph;
    if (committed?.id !== template.id) {
      currentState.resetDraft(template);
      return;
    }
    if (!currentState.hasUncommittedChanges) {
      currentState.resetDraft(template);
    }
  }, [draftStore, template]);

  const resolvedTemplate = draftTemplate ?? template ?? null;
  const resolvedScenes = scenes ?? resolvedTemplate?.scenes;
  const activeScene =
    resolvedScenes?.find((scene: VideoScene) => scene.id === activeSceneId) ?? resolvedScenes?.[0] ?? null;
  const resolvedLayers = layers ?? activeScene?.layers;
  const activeLayer = resolvedLayers?.find((layer: VideoLayer) => layer.id === activeLayerId) ?? null;
  const [resolvedMedia, setResolvedMedia] = React.useState<VideoTemplateMediaResolution | null>(null);
  const [isMediaLoading, setIsMediaLoading] = React.useState(false);

  const workspaceTokens = React.useMemo(
    () =>
      ({
        '--video-workspace-bg': 'var(--color-df-editor-bg)',
        '--video-workspace-panel': 'var(--color-df-surface)',
        '--video-workspace-border': 'var(--color-df-editor-border)',
        '--video-workspace-muted': 'var(--color-df-control-bg)',
        '--video-workspace-preview': 'var(--color-df-canvas-bg)',
        '--video-workspace-text': 'var(--color-df-text-primary)',
        '--video-workspace-text-muted': 'var(--color-df-text-tertiary)',
      }) as React.CSSProperties,
    []
  );

  const adapterReady = adapter !== undefined;
  const currentDelta = React.useMemo(() => {
    if (!draftTemplate || !committedTemplate) {
      return null;
    }
    return calculateVideoTemplateDelta(committedTemplate, draftTemplate);
  }, [committedTemplate, draftTemplate]);

  const sceneDraftIds = currentDelta?.sceneIds;
  const layerDraftIds = activeScene ? currentDelta?.layerIdsByScene[activeScene.id] : undefined;

  const hasDraftForId = (deltaIds: DraftDeltaIds | undefined, id: string | undefined): boolean => {
    if (!deltaIds || !id) {
      return false;
    }
    return deltaIds.added.includes(id) || deltaIds.updated.includes(id) || deltaIds.removed.includes(id);
  };

  const handleUpdateLayer = React.useCallback(
    (layerId: string, updates: Partial<Pick<VideoLayer, 'startMs' | 'durationMs' | 'opacity'>>) => {
      draftStore.getState().updateLayer(layerId, updates);
    },
    [draftStore]
  );

  const handleCommitDraft = React.useCallback(() => {
    if (!currentDelta || !draftTemplate) {
      return;
    }
    const updatedLayers = Object.values(currentDelta.layersByScene).flatMap((delta) => delta.updated);
    updatedLayers.forEach((layer) => {
      onUpdateLayerStart?.(layer.id, layer.startMs);
      if (layer.durationMs !== undefined) {
        onUpdateLayerDuration?.(layer.id, layer.durationMs);
      }
      if (layer.opacity !== undefined) {
        onUpdateLayerOpacity?.(layer.id, layer.opacity);
      }
    });
    draftStore.getState().commitDraft();
  }, [currentDelta, draftStore, draftTemplate, onUpdateLayerDuration, onUpdateLayerOpacity, onUpdateLayerStart]);

  const handleDiscardDraft = React.useCallback(() => {
    draftStore.getState().discardDraft();
  }, [draftStore]);
  const mediaRequest = React.useMemo(() => {
    const inputGroups = [activeLayer?.inputs, activeScene?.inputs, resolvedTemplate?.inputs];
    for (const inputs of inputGroups) {
      const imageBinding = inputs?.[BINDING_KEY.MEDIA_IMAGE];
      if (imageBinding) {
        return { mediaId: imageBinding, kind: VIDEO_MEDIA_KIND.IMAGE } satisfies VideoTemplateMediaRequest;
      }
      const videoBinding = inputs?.[BINDING_KEY.MEDIA_VIDEO];
      if (videoBinding) {
        return { mediaId: videoBinding, kind: VIDEO_MEDIA_KIND.VIDEO } satisfies VideoTemplateMediaRequest;
      }
    }
    return null;
  }, [activeLayer?.inputs, activeScene?.inputs, resolvedTemplate?.inputs]);

  React.useEffect(() => {
    let isMounted = true;
    if (!adapter?.resolveMedia || !mediaRequest) {
      setResolvedMedia(null);
      return;
    }
    setIsMediaLoading(true);
    adapter
      .resolveMedia(mediaRequest)
      .then((resolved) => {
        if (!isMounted) return;
        setResolvedMedia(resolved ?? null);
      })
      .catch(() => {
        if (!isMounted) return;
        setResolvedMedia(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsMediaLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [adapter, mediaRequest]);

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col gap-4 rounded-lg border border-[var(--video-workspace-border)] bg-[var(--video-workspace-bg)] p-4',
        className
      )}
      style={workspaceTokens}
    >
      <Card className="flex items-center justify-between border-[var(--video-workspace-border)] bg-[var(--video-workspace-panel)] px-4 py-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--video-workspace-text)]">Video Template Workspace</span>
            <Badge variant="secondary" className="text-[11px]">
              {adapterReady ? 'Adapter ready' : 'Adapter unbound'}
            </Badge>
            {hasUncommittedChanges ? (
              <Badge variant="secondary" className="text-[11px]">
                Draft changes
              </Badge>
            ) : null}
            {headerNotice ? (
              <Badge variant="secondary" className="text-[11px]">
                {headerNotice}
              </Badge>
            ) : null}
          </div>
          <div className="text-xs text-[var(--video-workspace-text-muted)]">
            {template ? `Editing ${template.name}` : 'Select a template to begin.'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" disabled={!adapterReady}>
            Load
          </Button>
          <Button size="sm" variant="secondary" onClick={handleDiscardDraft} disabled={!hasUncommittedChanges}>
            Discard
          </Button>
          <Button size="sm" onClick={handleCommitDraft} disabled={!hasUncommittedChanges}>
            Commit
          </Button>
          {onSaveTemplate ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={!adapterReady || !template || saveDisabled}
              onClick={onSaveTemplate}
            >
              Save
            </Button>
          ) : null}
        </div>
      </Card>

      <div className="grid flex-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-4">
          <SceneList
            scenes={resolvedScenes}
            activeSceneId={activeScene?.id}
            draftSceneIds={sceneDraftIds}
            onSelectScene={onSelectScene}
            onAddScene={onAddScene}
          />
          <LayerList
            layers={resolvedLayers}
            activeLayerId={activeLayer?.id}
            draftLayerIds={layerDraftIds}
            onSelectLayer={onSelectLayer}
            onAddLayer={onAddLayer}
          />
        </div>

        <Preview
          template={resolvedTemplate ?? undefined}
          isPlaying={isPlaying}
          onTogglePlayback={onTogglePlayback}
          resolvedMedia={resolvedMedia}
          isMediaLoading={isMediaLoading}
        />

        <LayerInspector
          layer={activeLayer ?? undefined}
          hasDraftChanges={hasDraftForId(layerDraftIds, activeLayer?.id)}
          onUpdateLayerStart={(layerId, startMs) => handleUpdateLayer(layerId, { startMs })}
          onUpdateLayerDuration={(layerId, durationMs) => handleUpdateLayer(layerId, { durationMs })}
          onUpdateLayerOpacity={(layerId, opacity) => handleUpdateLayer(layerId, { opacity })}
        />
      </div>

      <div className="min-h-[220px]">
        <Timeline scene={activeScene ?? undefined} />
      </div>
    </div>
  );
}
