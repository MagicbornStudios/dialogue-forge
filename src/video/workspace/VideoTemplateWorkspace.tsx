import type { VideoLayer } from '@/video/templates/types/video-layer';
import type { VideoScene } from '@/video/templates/types/video-scene';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import type { VideoTemplateWorkspaceAdapter } from './video-template-workspace-contracts';
import type { VideoTemplateMediaRequest, VideoTemplateMediaResolution } from './video-template-workspace-contracts';
import { VIDEO_MEDIA_KIND } from './video-template-workspace-contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { SceneList } from './components/SceneList';
import { LayerList } from './components/LayerList';
import { LayerInspector } from './components/LayerInspector';
import { Preview } from './components/Preview';
import { Timeline } from './components/Timeline';
import { cn } from '@/shared/lib/utils';
import { BINDING_KEY } from '@/shared/types/bindings';
import * as React from 'react';

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
  onAddLayer?: () => void;
  onTogglePlayback?: () => void;
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
  onTogglePlayback,
}: VideoTemplateWorkspaceProps) {
  const resolvedScenes = scenes ?? template?.scenes;
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
  const mediaRequest = React.useMemo(() => {
    const inputGroups = [activeLayer?.inputs, activeScene?.inputs, template?.inputs];
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
  }, [activeLayer?.inputs, activeScene?.inputs, template?.inputs]);

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
          </div>
          <div className="text-xs text-[var(--video-workspace-text-muted)]">
            {template ? `Editing ${template.name}` : 'Select a template to begin.'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" disabled={!adapterReady}>
            Load
          </Button>
          <Button size="sm" variant="secondary" disabled={!adapterReady || !template}>
            Save
          </Button>
        </div>
      </Card>

      <div className="grid flex-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-4">
          <SceneList
            scenes={resolvedScenes}
            activeSceneId={activeScene?.id}
            onSelectScene={onSelectScene}
            onAddScene={onAddScene}
          />
          <LayerList
            layers={resolvedLayers}
            activeLayerId={activeLayer?.id}
            onSelectLayer={onSelectLayer}
            onAddLayer={onAddLayer}
          />
        </div>

        <Preview
          template={template}
          isPlaying={isPlaying}
          onTogglePlayback={onTogglePlayback}
          resolvedMedia={resolvedMedia}
          isMediaLoading={isMediaLoading}
        />

        <LayerInspector layer={activeLayer ?? undefined} />
      </div>

      <div className="min-h-[220px]">
        <Timeline scene={activeScene ?? undefined} />
      </div>
    </div>
  );
}
