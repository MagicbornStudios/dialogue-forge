import type { VideoLayer } from '@/video/templates/types/video-layer';
import type { VideoScene } from '@/video/templates/types/video-scene';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import type { VideoTemplateWorkspaceAdapter } from './video-template-workspace-contracts';
import type { VideoTemplateMediaRequest, VideoTemplateMediaResolution } from './video-template-workspace-contracts';
import { VIDEO_MEDIA_KIND } from './video-template-workspace-contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
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
  onLoadTemplates?: () => void | Promise<void>;
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
  onDuplicateScene,
  onDeleteScene,
  onAddLayer,
  onDeleteLayer,
  onUpdateLayerStart,
  onUpdateLayerDuration,
  onUpdateLayerOpacity,
  onUpdateTemplateMetadata,
  onTogglePlayback,
  onLoadTemplates,
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
  const [templateNotice, setTemplateNotice] = React.useState<string | null>(null);
  const [isTemplateLoading, setIsTemplateLoading] = React.useState(false);

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
  const [metadataDraft, setMetadataDraft] = React.useState({
    name: resolvedTemplate?.name ?? '',
    width: resolvedTemplate?.width ? String(resolvedTemplate.width) : '',
    height: resolvedTemplate?.height ? String(resolvedTemplate.height) : '',
    frameRate: resolvedTemplate?.frameRate ? String(resolvedTemplate.frameRate) : '',
  });

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
  const canLoadTemplates = Boolean(onLoadTemplates || adapter?.listTemplates);
  const canEditMetadata = Boolean(resolvedTemplate && onUpdateTemplateMetadata);
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

  const handleLoadTemplates = React.useCallback(async () => {
    if (isTemplateLoading) {
      return;
    }
    setIsTemplateLoading(true);
    setTemplateNotice(null);
    try {
      if (onLoadTemplates) {
        await onLoadTemplates();
        setTemplateNotice('Templates refreshed');
      } else if (adapter?.listTemplates) {
        const templates = await adapter.listTemplates();
        setTemplateNotice(`Loaded ${templates.length} templates`);
      } else {
        setTemplateNotice('No template source connected');
      }
    } catch (error) {
      setTemplateNotice('Failed to load templates');
    } finally {
      setIsTemplateLoading(false);
    }
  }, [adapter, isTemplateLoading, onLoadTemplates]);

  const handleMetadataChange = React.useCallback(
    (field: 'name' | 'width' | 'height' | 'frameRate', value: string) => {
      setMetadataDraft((prev) => ({ ...prev, [field]: value }));
      if (!onUpdateTemplateMetadata) {
        return;
      }
      if (field === 'name') {
        onUpdateTemplateMetadata({ name: value });
        return;
      }
      if (value.trim() === '') {
        return;
      }
      const numericValue = Number(value);
      if (Number.isNaN(numericValue)) {
        return;
      }
      const normalizedValue =
        field === 'frameRate' ? Math.max(1, numericValue) : Math.max(1, Math.round(numericValue));
      onUpdateTemplateMetadata({ [field]: normalizedValue });
    },
    [onUpdateTemplateMetadata]
  );

  React.useEffect(() => {
    setMetadataDraft({
      name: resolvedTemplate?.name ?? '',
      width: resolvedTemplate?.width ? String(resolvedTemplate.width) : '',
      height: resolvedTemplate?.height ? String(resolvedTemplate.height) : '',
      frameRate: resolvedTemplate?.frameRate ? String(resolvedTemplate.frameRate) : '',
    });
  }, [resolvedTemplate?.frameRate, resolvedTemplate?.height, resolvedTemplate?.id, resolvedTemplate?.name, resolvedTemplate?.width]);

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
            {templateNotice ? (
              <Badge variant="secondary" className="text-[11px]">
                {templateNotice}
              </Badge>
            ) : null}
          </div>
          <div className="text-xs text-[var(--video-workspace-text-muted)]">
            {template ? `Editing ${template.name}` : 'Select a template to begin.'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" disabled={!canLoadTemplates || isTemplateLoading} onClick={handleLoadTemplates}>
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

      <Card className="border-[var(--video-workspace-border)] bg-[var(--video-workspace-panel)] px-4 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--video-workspace-text)]">Template Metadata</div>
              <div className="text-xs text-[var(--video-workspace-text-muted)]">
                Update basics to see changes propagate through the workspace.
              </div>
            </div>
            <Badge variant="secondary" className="text-[11px]">
              {resolvedTemplate ? 'Editable' : 'No template'}
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1 text-xs">
              <label className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">
                Name
              </label>
              <Input
                value={metadataDraft.name}
                onChange={(event) => handleMetadataChange('name', event.target.value)}
                placeholder="Template name"
                className="h-8"
                disabled={!canEditMetadata}
              />
            </div>
            <div className="space-y-1 text-xs">
              <label className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">
                Width
              </label>
              <Input
                type="number"
                min={1}
                value={metadataDraft.width}
                onChange={(event) => handleMetadataChange('width', event.target.value)}
                placeholder="1920"
                className="h-8"
                disabled={!canEditMetadata}
              />
            </div>
            <div className="space-y-1 text-xs">
              <label className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">
                Height
              </label>
              <Input
                type="number"
                min={1}
                value={metadataDraft.height}
                onChange={(event) => handleMetadataChange('height', event.target.value)}
                placeholder="1080"
                className="h-8"
                disabled={!canEditMetadata}
              />
            </div>
            <div className="space-y-1 text-xs">
              <label className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">
                FPS
              </label>
              <Input
                type="number"
                min={1}
                value={metadataDraft.frameRate}
                onChange={(event) => handleMetadataChange('frameRate', event.target.value)}
                placeholder="30"
                className="h-8"
                disabled={!canEditMetadata}
              />
            </div>
          </div>
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
            onDuplicateScene={onDuplicateScene}
            onDeleteScene={onDeleteScene}
          />
          <LayerList
            layers={resolvedLayers}
            activeLayerId={activeLayer?.id}
            draftLayerIds={layerDraftIds}
            onSelectLayer={onSelectLayer}
            onAddLayer={onAddLayer}
            onDeleteLayer={onDeleteLayer}
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
