import * as React from 'react';
import type { VideoLayer } from '@/video/templates/types/video-layer';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';

interface LayerInspectorProps {
  layer?: VideoLayer | null;
}

export function LayerInspector({ layer }: LayerInspectorProps) {
  const hasBinding = layer !== undefined;

  return (
    <Card className="h-full border-[var(--video-workspace-border)] bg-[var(--video-workspace-panel)]">
      <CardHeader className="flex-row items-center justify-between space-y-0 px-4 py-3">
        <span className="text-sm font-semibold text-[var(--video-workspace-text)]">Layer Inspector</span>
        <Badge variant="secondary" className="text-[11px]">
          {hasBinding ? 'Ready' : 'Unbound'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 text-xs">
        {!hasBinding ? (
          <div className="rounded-md border border-dashed border-[var(--video-workspace-border)] bg-[var(--video-workspace-muted)] p-3 text-[var(--video-workspace-text-muted)]">
            Connect layer selection to inspect properties.
          </div>
        ) : layer ? (
          <div className="space-y-2">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">Name</div>
              <div className="text-[var(--video-workspace-text)]">{layer.name || 'Untitled layer'}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">Start</div>
                <div className="text-[var(--video-workspace-text)]">{(layer.startMs / 1000).toFixed(2)}s</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">Duration</div>
                <div className="text-[var(--video-workspace-text)]">
                  {layer.durationMs ? `${(layer.durationMs / 1000).toFixed(2)}s` : 'Auto'}
                </div>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">Opacity</div>
              <div className="text-[var(--video-workspace-text)]">
                {layer.opacity !== undefined ? `${Math.round(layer.opacity * 100)}%` : '100%'}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">Inputs</div>
              <div className="text-[var(--video-workspace-text)]">
                {layer.inputs ? `${Object.keys(layer.inputs).length} bound` : 'No bindings'}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-[var(--video-workspace-border)] bg-[var(--video-workspace-muted)] p-3 text-[var(--video-workspace-text-muted)]">
            Select a layer to inspect its properties.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
