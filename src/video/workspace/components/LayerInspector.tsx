import * as React from 'react';
import type { VideoLayer } from '@/video/templates/types/video-layer';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { TEMPLATE_INPUT_KEY, type TemplateInputKey } from '@/shared/types/bindings';

interface LayerInspectorProps {
  layer?: VideoLayer | null;
  hasDraftChanges?: boolean;
  onUpdateLayerStart?: (layerId: string, startMs: number) => void;
  onUpdateLayerDuration?: (layerId: string, durationMs: number) => void;
  onUpdateLayerOpacity?: (layerId: string, opacity: number) => void;
}

const TEMPLATE_INPUT_KEYS = new Set<TemplateInputKey>(Object.values(TEMPLATE_INPUT_KEY));

export function LayerInspector({
  layer,
  hasDraftChanges,
  onUpdateLayerStart,
  onUpdateLayerDuration,
  onUpdateLayerOpacity,
}: LayerInspectorProps) {
  const hasBinding = layer !== undefined;
  const bindingEntries = React.useMemo(() => {
    if (!layer?.inputs) {
      return [];
    }

    return Object.entries(layer.inputs).filter(([, bindingKey]) => TEMPLATE_INPUT_KEYS.has(bindingKey));
  }, [layer?.inputs]);

  const handleStartChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!layer) return;
    const value = Number(event.target.value);
    if (Number.isNaN(value)) {
      return;
    }
    const nextStart = Math.max(0, Math.round(value * 1000));
    onUpdateLayerStart?.(layer.id, nextStart);
  };

  const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!layer) return;
    const value = event.target.value;
    if (!value) {
      return;
    }
    const durationSeconds = Number(value);
    if (Number.isNaN(durationSeconds)) {
      return;
    }
    const nextDuration = Math.max(0, Math.round(durationSeconds * 1000));
    onUpdateLayerDuration?.(layer.id, nextDuration);
  };

  const handleOpacityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!layer) return;
    const value = Number(event.target.value);
    if (Number.isNaN(value)) {
      return;
    }
    const normalized = Math.min(1, Math.max(0, value / 100));
    onUpdateLayerOpacity?.(layer.id, normalized);
  };

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
              <div className="flex items-center gap-2 text-[var(--video-workspace-text)]">
                <span>{layer.name || 'Untitled layer'}</span>
                {hasDraftChanges ? (
                  <Badge variant="secondary" className="px-1 text-[9px]">
                    Draft
                  </Badge>
                ) : null}
              </div>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">
                  Start (s)
                </div>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={Number.isFinite(layer.startMs) ? (layer.startMs / 1000).toFixed(2) : ''}
                  onChange={handleStartChange}
                  className="h-8"
                />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">
                  Duration (s)
                </div>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={layer.durationMs !== undefined ? (layer.durationMs / 1000).toFixed(2) : ''}
                  onChange={handleDurationChange}
                  className="h-8"
                />
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">Opacity</div>
              <div className="text-[var(--video-workspace-text)]">
                {layer.opacity !== undefined ? `${Math.round(layer.opacity * 100)}%` : '100%'}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">
                Opacity (%)
              </div>
              <Input
                type="number"
                min={0}
                max={100}
                step={5}
                value={layer.opacity !== undefined ? Math.round(layer.opacity * 100) : 100}
                onChange={handleOpacityChange}
                className="h-8"
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">Inputs</div>
              <div className="text-[var(--video-workspace-text)]">
                {bindingEntries.length > 0 ? `${bindingEntries.length} bound` : 'No bindings'}
              </div>
              {bindingEntries.length > 0 ? (
                <div className="mt-2 space-y-1 text-[var(--video-workspace-text-muted)]">
                  {bindingEntries.map(([inputName, bindingKey]) => (
                    <div key={inputName} className="flex items-center justify-between">
                      <span className="truncate">{inputName}</span>
                      <span className="ml-2 rounded bg-[var(--video-workspace-muted)] px-2 py-1 text-[10px]">
                        {bindingKey}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
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
