'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { makePayloadVideoTemplateAdapter } from '@/app/lib/video/payload-video-template-adapter';
import type { VideoLayer } from '@/video/templates/types/video-layer';
import type { VideoScene } from '@/video/templates/types/video-scene';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import { VideoTemplateWorkspace } from '@/video/workspace/VideoTemplateWorkspace';
import type { VideoTemplateWorkspaceTemplateSummary } from '@/video/workspace/video-template-workspace-contracts';
import { compileTemplate } from '@/video/templates/compile/compile-template';
import type { VideoComposition } from '@/video/templates/types/video-composition';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { RemotionPreview } from './components/RemotionPreview';

type VideoTemplateMetadataUpdate = Partial<Pick<VideoTemplate, 'name' | 'width' | 'height' | 'frameRate'>>;

const createTemplateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `template_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const createScene = (sceneCount: number, durationMs: number): VideoScene => ({
  id: createTemplateId(),
  name: `Scene ${sceneCount + 1}`,
  durationMs,
  layers: [],
});

const createLayer = (layerCount: number, durationMs: number): VideoLayer => ({
  id: createTemplateId(),
  name: `Layer ${layerCount + 1}`,
  startMs: 0,
  durationMs,
  opacity: 1,
});

export function VideoStudio() {
  const videoTemplateAdapter = useMemo(() => makePayloadVideoTemplateAdapter(), []);
  const [templateSummaries, setTemplateSummaries] = useState<VideoTemplateWorkspaceTemplateSummary[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string | undefined>(undefined);
  const [activeLayerId, setActiveLayerId] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

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

  const { composition, compositionError } = useMemo((): {
    composition: VideoComposition | null;
    compositionError: string | null;
  } => {
    if (!selectedTemplate) {
      return { composition: null, compositionError: null };
    }
    try {
      return { composition: compileTemplate(selectedTemplate, {}), compositionError: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to compile preview composition.';
      return { composition: null, compositionError: message };
    }
  }, [selectedTemplate]);

  useEffect(() => {
    setCurrentFrame(0);
  }, [composition?.id, composition?.durationMs, composition?.frameRate]);

  const persistTemplate = useCallback(
    (updater: (template: VideoTemplate) => VideoTemplate) => {
      setSelectedTemplate((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        void videoTemplateAdapter
          .saveTemplate(next)
          .then((saved) => {
            setSelectedTemplate(saved);
            setSelectedTemplateId(saved.id);
            setTemplateSummaries((summaries) => {
              const existing = summaries.find((summary) => summary.id === saved.id);
              if (!existing) {
                return [...summaries, { id: saved.id, name: saved.name }];
              }
              return summaries.map((summary) =>
                summary.id === saved.id ? { ...summary, name: saved.name } : summary
              );
            });
          })
          .catch(() => {
            setSelectedTemplate(next);
          });
        return next;
      });
    },
    [videoTemplateAdapter]
  );

  const handleSelectScene = (sceneId: string) => {
    setActiveSceneId(sceneId);
    const selectedScene = selectedTemplate?.scenes?.find((scene) => scene.id === sceneId);
    setActiveLayerId(selectedScene?.layers?.[0]?.id);
  };

  const handleSelectLayer = (layerId: string) => {
    setActiveLayerId(layerId);
  };

  const handleAddScene = useCallback(() => {
    if (!selectedTemplate) return;
    const durationMs = selectedTemplate.scenes[selectedTemplate.scenes.length - 1]?.durationMs ?? 5000;
    const newScene = createScene(selectedTemplate.scenes.length, durationMs);
    persistTemplate((template) => ({
      ...template,
      scenes: [...template.scenes, newScene],
    }));
    setActiveSceneId(newScene.id);
    setActiveLayerId(undefined);
  }, [persistTemplate, selectedTemplate]);

  const handleDuplicateScene = useCallback(
    (sceneId: string) => {
      if (!selectedTemplate) return;
      const sceneIndex = selectedTemplate.scenes.findIndex((scene) => scene.id === sceneId);
      if (sceneIndex < 0) return;
      const sourceScene = selectedTemplate.scenes[sceneIndex];
      const duplicatedScene: VideoScene = {
        ...sourceScene,
        id: createTemplateId(),
        name: sourceScene.name ? `${sourceScene.name} Copy` : `Scene ${selectedTemplate.scenes.length + 1}`,
        layers: sourceScene.layers.map((layer) => ({
          ...layer,
          id: createTemplateId(),
        })),
      };
      const nextScenes = [
        ...selectedTemplate.scenes.slice(0, sceneIndex + 1),
        duplicatedScene,
        ...selectedTemplate.scenes.slice(sceneIndex + 1),
      ];
      persistTemplate((template) => ({
        ...template,
        scenes: nextScenes,
      }));
      setActiveSceneId(duplicatedScene.id);
      setActiveLayerId(duplicatedScene.layers[0]?.id);
    },
    [persistTemplate, selectedTemplate]
  );

  const handleDeleteScene = useCallback(
    (sceneId: string) => {
      if (!selectedTemplate) return;
      const nextScenes = selectedTemplate.scenes.filter((scene) => scene.id !== sceneId);
      if (nextScenes.length === selectedTemplate.scenes.length) return;
      persistTemplate((template) => ({
        ...template,
        scenes: nextScenes,
      }));
      if (activeSceneId === sceneId) {
        const nextActiveScene = nextScenes[0];
        setActiveSceneId(nextActiveScene?.id);
        setActiveLayerId(nextActiveScene?.layers?.[0]?.id);
      }
    },
    [activeSceneId, persistTemplate, selectedTemplate]
  );

  const handleAddLayer = useCallback(() => {
    if (!selectedTemplate) return;
    const targetSceneId = activeSceneId ?? selectedTemplate.scenes[0]?.id;
    if (!targetSceneId) return;
    const targetScene = selectedTemplate.scenes.find((scene) => scene.id === targetSceneId);
    if (!targetScene) return;
    const newLayer = createLayer(targetScene.layers.length, targetScene.durationMs);
    const nextScenes = selectedTemplate.scenes.map((scene) =>
      scene.id === targetSceneId ? { ...scene, layers: [...scene.layers, newLayer] } : scene
    );
    persistTemplate((template) => ({
      ...template,
      scenes: nextScenes,
    }));
    setActiveSceneId(targetSceneId);
    setActiveLayerId(newLayer.id);
  }, [activeSceneId, persistTemplate, selectedTemplate]);

  const handleDeleteLayer = useCallback(
    (layerId: string) => {
      if (!selectedTemplate) return;
      let nextActiveLayerId = activeLayerId;
      let nextActiveSceneId = activeSceneId;
      const nextScenes = selectedTemplate.scenes.map((scene) => {
        if (!scene.layers.some((layer) => layer.id === layerId)) {
          return scene;
        }
        const nextLayers = scene.layers.filter((layer) => layer.id !== layerId);
        if (activeLayerId === layerId) {
          nextActiveLayerId = nextLayers[0]?.id;
          nextActiveSceneId = scene.id;
        }
        return { ...scene, layers: nextLayers };
      });
      persistTemplate((template) => ({
        ...template,
        scenes: nextScenes,
      }));
      setActiveLayerId(nextActiveLayerId);
      setActiveSceneId(nextActiveSceneId);
    },
    [activeLayerId, activeSceneId, persistTemplate, selectedTemplate]
  );

  const handleUpdateLayer = useCallback(
    (layerId: string, updates: Partial<Pick<VideoLayer, 'startMs' | 'durationMs' | 'opacity'>>) => {
      if (!selectedTemplate) return;
      persistTemplate((template) => ({
        ...template,
        scenes: template.scenes.map((scene) => {
          if (!scene.layers.some((layer) => layer.id === layerId)) {
            return scene;
          }
          return {
            ...scene,
            layers: scene.layers.map((layer) => (layer.id === layerId ? { ...layer, ...updates } : layer)),
          };
        }),
      }));
    },
    [persistTemplate, selectedTemplate]
  );

  const handleUpdateTemplateMetadata = useCallback(
    (metadata: VideoTemplateMetadataUpdate) => {
      if (!selectedTemplate) return;
      persistTemplate((template) => ({
        ...template,
        ...metadata,
      }));
    },
    [persistTemplate, selectedTemplate]
  );

  const handleSetPlaying = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const handleFrameChange = useCallback(
    (frame: number) => {
      setCurrentFrame(frame);
    },
    [setCurrentFrame]
  );

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
            <RemotionPreview
              composition={composition}
              errorMessage={compositionError}
              isPlaying={isPlaying}
              currentFrame={currentFrame}
              onFrameChange={handleFrameChange}
              onSetPlaying={handleSetPlaying}
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
            onAddScene={handleAddScene}
            onDuplicateScene={handleDuplicateScene}
            onDeleteScene={handleDeleteScene}
            onAddLayer={handleAddLayer}
            onDeleteLayer={handleDeleteLayer}
            onUpdateLayerStart={(layerId, startMs) => handleUpdateLayer(layerId, { startMs })}
            onUpdateLayerDuration={(layerId, durationMs) => handleUpdateLayer(layerId, { durationMs })}
            onUpdateLayerOpacity={(layerId, opacity) => handleUpdateLayer(layerId, { opacity })}
            onUpdateTemplateMetadata={handleUpdateTemplateMetadata}
          />
        </section>
      </div>
    </div>
  );
}
