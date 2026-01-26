import * as React from 'react';
import type { DraftDeltaIds } from '@/shared/types/draft';
import type { VideoScene } from '@/video/templates/types/video-scene';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';

interface SceneListProps {
  scenes?: VideoScene[];
  activeSceneId?: string;
  draftSceneIds?: DraftDeltaIds;
  onSelectScene?: (sceneId: string) => void;
  onAddScene?: () => void;
  onDuplicateScene?: (sceneId: string) => void;
  onDeleteScene?: (sceneId: string) => void;
}

export function SceneList({
  scenes,
  activeSceneId,
  draftSceneIds,
  onSelectScene,
  onAddScene,
  onDuplicateScene,
  onDeleteScene,
}: SceneListProps) {
  const hasBinding = scenes !== undefined;
  const totalScenes = scenes?.length ?? 0;
  const draftIds = new Set<string>([
    ...(draftSceneIds?.added ?? []),
    ...(draftSceneIds?.updated ?? []),
    ...(draftSceneIds?.removed ?? []),
  ]);

  return (
    <Card className="h-full border-[var(--video-workspace-border)] bg-[var(--video-workspace-panel)]">
      <CardHeader className="flex-row items-center justify-between space-y-0 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--video-workspace-text)]">Scenes</span>
          <Badge variant="secondary" className="text-[11px]">
            {hasBinding ? totalScenes : 'Unbound'}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={onAddScene}
          disabled={!hasBinding}
        >
          Add
        </Button>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {!hasBinding ? (
          <div className="rounded-md border border-dashed border-[var(--video-workspace-border)] bg-[var(--video-workspace-muted)] p-3 text-xs text-[var(--video-workspace-text-muted)]">
            Scene binding is not available yet.
          </div>
        ) : totalScenes === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--video-workspace-border)] bg-[var(--video-workspace-muted)] p-3 text-xs text-[var(--video-workspace-text-muted)]">
            No scenes have been added yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {scenes?.map((scene, index) => {
              const isActive = scene.id === activeSceneId;
              const isDraft = draftIds.has(scene.id);
              return (
                <div key={scene.id} className="flex items-center gap-2">
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => onSelectScene?.(scene.id)}
                    className={cn(
                      'h-auto flex-1 justify-between px-3 py-2 text-left text-xs',
                      isActive && 'border border-[var(--video-workspace-border)]'
                    )}
                  >
                    <span className="truncate text-[var(--video-workspace-text)]">
                      {scene.name || `Scene ${index + 1}`}
                    </span>
                    <span className="flex items-center gap-2 text-[10px] text-[var(--video-workspace-text-muted)]">
                      {isDraft ? (
                        <Badge variant="secondary" className="px-1 text-[9px]">
                          Draft
                        </Badge>
                      ) : null}
                      {(scene.durationMs / 1000).toFixed(1)}s
                    </span>
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-[10px]"
                      onClick={() => onDuplicateScene?.(scene.id)}
                      disabled={!onDuplicateScene}
                    >
                      Duplicate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-[10px] text-destructive hover:text-destructive"
                      onClick={() => onDeleteScene?.(scene.id)}
                      disabled={!onDeleteScene}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
