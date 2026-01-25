'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { makePayloadVideoTemplateAdapter } from '@/app/lib/video/payload-video-template-adapter';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import { VideoTemplateWorkspace } from '@/video/workspace/VideoTemplateWorkspace';
import { Preview } from '@/video/workspace/components/Preview';
import type {
  VideoTemplateMediaRequest,
  VideoTemplateMediaResolution,
  VideoTemplateWorkspaceTemplateSummary,
} from '@/video/workspace/video-template-workspace-contracts';
import { VIDEO_MEDIA_KIND } from '@/video/workspace/video-template-workspace-contracts';
import { BINDING_KEY } from '@/shared/types/bindings';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

export const dynamic = 'force-static';

export default function VideoStudioPage() {
  const videoTemplateAdapter = useMemo(() => makePayloadVideoTemplateAdapter(), []);
  const [templateSummaries, setTemplateSummaries] = useState<VideoTemplateWorkspaceTemplateSummary[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string | undefined>(undefined);
  const [activeLayerId, setActiveLayerId] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [resolvedMedia, setResolvedMedia] = useState<VideoTemplateMediaResolution | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(false);

  const workspaceTokens = useMemo(
    () =>
      ({
        '--video-workspace-bg': 'var(--color-df-editor-bg)',
        '--video-workspace-panel': 'var(--color-df-surface)',
        '--video-workspace-border': 'var(--color-df-editor-border)',
        '--video-workspace-muted': 'var(--color-df-control-bg)',
        '--video-workspace-preview': 'var(--color-df-canvas-bg)',
        '--video-workspace-text': 'var(--color-df-text-primary)',
        '--video-workspace-text-muted': 'var(--color-df-text-tertiary)',
      }) as CSSProperties,
    []
  );

  useEffect(() => {
    let isMounted = true;
    videoTemplateAdapter
      .listTemplates()
      .then((templates) => {
        if (!isMounted) return;
        setTemplateSummaries(templates);
      })
      .catch(() => {
        if (!isMounted) return;
        setTemplateSummaries([]);
      });
    return () => {
      isMounted = false;
    };
  }, [videoTemplateAdapter]);

  useEffect(() => {
    if (selectedTemplateId || templateSummaries.length === 0) {
      return;
    }
    setSelectedTemplateId(templateSummaries[0].id);
  }, [selectedTemplateId, templateSummaries]);

  useEffect(() => {
    let isMounted = true;
    if (!selectedTemplateId) {
      setSelectedTemplate(null);
      return;
    }
    videoTemplateAdapter
      .loadTemplate(selectedTemplateId)
      .then((template) => {
        if (!isMounted) return;
        setSelectedTemplate(template);
        const firstScene = template?.scenes?.[0];
        setActiveSceneId(firstScene?.id);
        setActiveLayerId(firstScene?.layers?.[0]?.id);
      })
      .catch(() => {
        if (!isMounted) return;
        setSelectedTemplate(null);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedTemplateId, videoTemplateAdapter]);

  const activeScene =
    selectedTemplate?.scenes?.find((scene) => scene.id === activeSceneId) ??
    selectedTemplate?.scenes?.[0] ??
    null;
  const activeLayer =
    activeScene?.layers?.find((layer) => layer.id === activeLayerId) ?? activeScene?.layers?.[0] ?? null;

  const mediaRequest = useMemo<VideoTemplateMediaRequest | null>(() => {
    const inputGroups = [activeLayer?.inputs, activeScene?.inputs, selectedTemplate?.inputs];
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
  }, [activeLayer?.inputs, activeScene?.inputs, selectedTemplate?.inputs]);

  useEffect(() => {
    let isMounted = true;
    if (!videoTemplateAdapter.resolveMedia || !mediaRequest) {
      setResolvedMedia(null);
      return;
    }
    setIsMediaLoading(true);
    videoTemplateAdapter
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
  }, [mediaRequest, videoTemplateAdapter]);

  const handleSelectScene = (sceneId: string) => {
    setActiveSceneId(sceneId);
    const selectedScene = selectedTemplate?.scenes?.find((scene) => scene.id === sceneId);
    setActiveLayerId(selectedScene?.layers?.[0]?.id);
  };

  const handleSelectLayer = (layerId: string) => {
    setActiveLayerId(layerId);
  };

  return (
    <div className="min-h-screen bg-[var(--video-workspace-bg)] text-[var(--video-workspace-text)]" style={workspaceTokens}>
      <div className="flex h-screen gap-4 p-6">
        <aside className="flex w-72 flex-col gap-4">
          <Card className="border-[var(--video-workspace-border)] bg-[var(--video-workspace-panel)]">
            <div className="flex items-center justify-between border-b border-[var(--video-workspace-border)] px-4 py-3">
              <div>
                <div className="text-sm font-semibold">Templates</div>
                <div className="text-xs text-[var(--video-workspace-text-muted)]">Select a video template</div>
              </div>
              <Button size="sm" variant="secondary" disabled>
                New
              </Button>
            </div>
            <div className="flex flex-col gap-2 p-4">
              {templateSummaries.length === 0 ? (
                <div className="rounded-md border border-dashed border-[var(--video-workspace-border)] bg-[var(--video-workspace-muted)] p-3 text-xs text-[var(--video-workspace-text-muted)]">
                  No templates available.
                </div>
              ) : (
                templateSummaries.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className={cn(
                      'flex w-full flex-col gap-1 rounded-md border px-3 py-2 text-left text-sm transition',
                      selectedTemplateId === template.id
                        ? 'border-transparent bg-primary text-primary-foreground'
                        : 'border-[var(--video-workspace-border)] bg-[var(--video-workspace-muted)] text-[var(--video-workspace-text)]'
                    )}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <span className="font-medium">{template.name}</span>
                    <span className="text-xs text-[var(--video-workspace-text-muted)]">
                      {template.updatedAt
                        ? `Updated ${new Date(template.updatedAt).toLocaleDateString()}`
                        : 'Preset template'}
                    </span>
                  </button>
                ))
              )}
            </div>
          </Card>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-4">
          <Card className="border-[var(--video-workspace-border)] bg-[var(--video-workspace-panel)] px-4 py-3">
            <div className="text-sm font-semibold">Video Studio</div>
            <div className="text-xs text-[var(--video-workspace-text-muted)]">
              Pick a template on the left to preview and edit.
            </div>
          </Card>
          <div className="flex-1">
            <Preview
              template={selectedTemplate}
              isPlaying={isPlaying}
              onTogglePlayback={() => setIsPlaying((prev) => !prev)}
              resolvedMedia={resolvedMedia}
              isMediaLoading={isMediaLoading}
            />
          </div>
        </main>

        <section className="flex w-[520px] min-w-0 flex-col">
          <VideoTemplateWorkspace
            className="h-full"
            template={selectedTemplate}
            adapter={videoTemplateAdapter}
            activeSceneId={activeScene?.id}
            activeLayerId={activeLayer?.id}
            isPlaying={isPlaying}
            onTogglePlayback={() => setIsPlaying((prev) => !prev)}
            onSelectScene={handleSelectScene}
            onSelectLayer={handleSelectLayer}
          />
        </section>
      </div>
    </div>
  );
}
