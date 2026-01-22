import type { VideoScene } from '@/video/templates/types/video-scene';
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
          <Button size="sm" variant="secondary" onClick={onZoomToFit} disabled={!hasBinding}>
            Fit
          </Button>
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
              <span>{(scene.durationMs / 1000).toFixed(2)}s</span>
            </div>
            <div className="space-y-2">
              {scene.layers.length === 0 ? (
                <div className="rounded-md border border-dashed border-[var(--video-workspace-border)] bg-[var(--video-workspace-muted)] p-3 text-xs text-[var(--video-workspace-text-muted)]">
                  No layers on the timeline.
                </div>
              ) : (
                scene.layers.map((layer) => (
                  <div
                    key={layer.id}
                    className="flex items-center justify-between rounded-md border border-[var(--video-workspace-border)] bg-[var(--video-workspace-muted)] px-3 py-2 text-xs"
                  >
                    <span className="text-[var(--video-workspace-text)]">
                      {layer.name || 'Untitled layer'}
                    </span>
                    <span className="text-[10px] text-[var(--video-workspace-text-muted)]">
                      {(layer.startMs / 1000).toFixed(2)}s →
                      {layer.durationMs ? ` ${(layer.durationMs / 1000).toFixed(2)}s` : ' end'}
                    </span>
                  </div>
                ))
              )}
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
