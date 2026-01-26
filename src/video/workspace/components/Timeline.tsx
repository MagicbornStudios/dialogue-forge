import * as React from 'react';
import type { VideoScene } from '@/video/templates/types/video-scene';
import type { VideoLayer } from '@/video/templates/types/video-layer';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';

interface TimelineProps {
  scene?: VideoScene | null;
  onSplitLayer?: () => void;
  onZoomToFit?: () => void;
}

export function Timeline({ scene, onSplitLayer, onZoomToFit }: TimelineProps) {
  const hasBinding = scene !== undefined;
  const [zoom, setZoom] = React.useState(1);
  const durationMs = scene?.durationMs ?? 0;
  const timelineMarkers = React.useMemo(() => [0, 0.25, 0.5, 0.75, 1], []);

  const handleZoomToFit = () => {
    setZoom(1);
    onZoomToFit?.();
  };

  return (
    <Card className="h-full border-[var(--video-workspace-border)] bg-[var(--video-workspace-panel)]">
      <CardHeader className="flex-row items-center justify-between space-y-0 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--video-workspace-text)]">Timeline</span>
          <Badge variant="secondary" className="text-[11px]">
            {hasBinding ? `${scene?.layers?.length ?? 0} tracks` : 'Unbound'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={onSplitLayer} disabled={!hasBinding}>
            Split
          </Button>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handleZoomToFit} disabled={!hasBinding}>
              Fit
            </Button>
            <span className="text-[10px] text-[var(--video-workspace-text-muted)]">
              Zoom {zoom.toFixed(1)}x
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {!hasBinding ? (
          <div className="rounded-md border border-dashed border-[var(--video-workspace-border)] bg-[var(--video-workspace-muted)] p-4 text-xs text-[var(--video-workspace-text-muted)]">
            Timeline binding is not available yet.
          </div>
        ) : scene ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-[var(--video-workspace-text-muted)]">
              <span>Scene duration</span>
              <span>{(durationMs / 1000).toFixed(2)}s</span>
            </div>
            <div className="rounded-md border border-[var(--video-workspace-border)] bg-[var(--video-workspace-muted)]">
              <div className="flex border-b border-[var(--video-workspace-border)] text-[10px] text-[var(--video-workspace-text-muted)]">
                <div className="w-32 border-r border-[var(--video-workspace-border)] px-3 py-2">
                  Tracks
                </div>
                <div className="flex-1 overflow-x-auto">
                  <div
                    className="relative h-7 min-w-full"
                    style={{ width: `calc(${zoom} * 100%)` }}
                  >
                    {timelineMarkers.map((marker) => (
                      <div
                        key={marker}
                        className="absolute top-0 flex h-full -translate-x-1/2 items-center gap-2 text-[10px]"
                        style={{ left: `${marker * 100}%` }}
                      >
                        <span className="h-3 w-px bg-[var(--video-workspace-border)]" />
                        <span>{(durationMs * marker / 1000).toFixed(1)}s</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="divide-y divide-[var(--video-workspace-border)]">
                {scene.layers.length === 0 ? (
                  <div className="p-3 text-xs text-[var(--video-workspace-text-muted)]">
                    No layers on the timeline.
                  </div>
                ) : (
                  scene.layers.map((layer: VideoLayer) => {
                    const startRatio = durationMs ? Math.max(0, layer.startMs / durationMs) : 0;
                    const durationRatio = durationMs
                      ? Math.max(0.02, (layer.durationMs ?? 0) / durationMs)
                      : 0;
                    const clipWidth = Math.min(1, startRatio + durationRatio) - startRatio;
                    return (
                      <div key={layer.id} className="flex items-stretch text-xs">
                        <div className="w-32 border-r border-[var(--video-workspace-border)] px-3 py-2 text-[var(--video-workspace-text)]">
                          {layer.name || 'Untitled layer'}
                        </div>
                        <div className="flex-1 overflow-x-auto">
                          <div
                            className="relative h-12 min-w-full"
                            style={{ width: `calc(${zoom} * 100%)` }}
                          >
                            <div className="absolute inset-0 flex">
                              {timelineMarkers.map((marker) => (
                                <div
                                  key={`grid-${layer.id}-${marker}`}
                                  className="h-full w-px bg-[var(--video-workspace-border)]"
                                  style={{ left: `${marker * 100}%`, position: 'absolute' }}
                                />
                              ))}
                            </div>
                            <div
                              className="absolute inset-y-2 rounded-md border border-[var(--video-workspace-border)] bg-[var(--video-workspace-panel)] px-2 py-1 text-[10px] text-[var(--video-workspace-text)] shadow-sm"
                              style={{
                                left: `${startRatio * 100}%`,
                                width: `${clipWidth * 100}%`,
                              }}
                            >
                              {(layer.startMs / 1000).toFixed(2)}s →
                              {layer.durationMs ? ` ${(layer.durationMs / 1000).toFixed(2)}s` : ' end'}
                            </div>
                            <div className="absolute inset-y-0 left-0 flex w-px flex-col">
                              <div className="h-full bg-[var(--video-workspace-accent, #38bdf8)]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[var(--video-workspace-border)] bg-[var(--video-workspace-muted)] p-4 text-xs text-[var(--video-workspace-text-muted)]">
            Select a scene to view the timeline.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
