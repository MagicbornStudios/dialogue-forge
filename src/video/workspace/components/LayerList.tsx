import * as React from 'react';
import type { DraftDeltaIds } from '@/shared/types/draft';
import type { VideoLayer } from '@/video/templates/types/video-layer';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';

interface LayerListProps {
  layers?: VideoLayer[];
  activeLayerId?: string;
  draftLayerIds?: DraftDeltaIds;
  onSelectLayer?: (layerId: string) => void;
  onAddLayer?: () => void;
  onDeleteLayer?: (layerId: string) => void;
}

export function LayerList({
  layers,
  activeLayerId,
  draftLayerIds,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
}: LayerListProps) {
  const hasBinding = layers !== undefined;
  const totalLayers = layers?.length ?? 0;
  const draftIds = new Set<string>([
    ...(draftLayerIds?.added ?? []),
    ...(draftLayerIds?.updated ?? []),
    ...(draftLayerIds?.removed ?? []),
  ]);

  return (
    <Card className="h-full border-[var(--video-workspace-border)] bg-[var(--video-workspace-panel)]">
      <CardHeader className="flex-row items-center justify-between space-y-0 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--video-workspace-text)]">Layers</span>
          <Badge variant="secondary" className="text-[11px]">
            {hasBinding ? totalLayers : 'Unbound'}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={onAddLayer}
          disabled={!hasBinding}
        >
          Add
        </Button>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {!hasBinding ? (
          <div className="rounded-md border border-dashed border-[var(--video-workspace-border)] bg-[var(--video-workspace-muted)] p-3 text-xs text-[var(--video-workspace-text-muted)]">
            Layer binding is not available yet.
          </div>
        ) : totalLayers === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--video-workspace-border)] bg-[var(--video-workspace-muted)] p-3 text-xs text-[var(--video-workspace-text-muted)]">
            Add a layer to start compositing.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {layers?.map((layer, index) => {
              const isActive = layer.id === activeLayerId;
              const isDraft = draftIds.has(layer.id);
              return (
                <div key={layer.id} className="flex items-center gap-2">
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => onSelectLayer?.(layer.id)}
                    className={cn(
                      'h-auto flex-1 justify-between px-3 py-2 text-left text-xs',
                      isActive && 'border border-[var(--video-workspace-border)]'
                    )}
                  >
                    <span className="truncate text-[var(--video-workspace-text)]">
                      {layer.name || `Layer ${index + 1}`}
                    </span>
                    <span className="flex items-center gap-2 text-[10px] text-[var(--video-workspace-text-muted)]">
                      {isDraft ? (
                        <Badge variant="secondary" className="px-1 text-[9px]">
                          Draft
                        </Badge>
                      ) : null}
                      {layer.opacity !== undefined ? `${Math.round(layer.opacity * 100)}%` : '100%'}
                    </span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-[10px] text-destructive hover:text-destructive"
                    onClick={() => onDeleteLayer?.(layer.id)}
                    disabled={!onDeleteLayer}
                  >
                    Delete
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
