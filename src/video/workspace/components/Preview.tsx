import * as React from 'react';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import type { VideoTemplateMediaResolution } from '@/video/workspace/video-template-workspace-contracts';
import { VIDEO_MEDIA_KIND } from '@/video/workspace/video-template-workspace-contracts';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';

interface PreviewProps {
  template?: VideoTemplate | null;
  isPlaying?: boolean;
  onTogglePlayback?: () => void;
  resolvedMedia?: VideoTemplateMediaResolution | null;
  isMediaLoading?: boolean;
}

export function Preview({ template, isPlaying, onTogglePlayback, resolvedMedia, isMediaLoading }: PreviewProps) {
  const hasBinding = template !== undefined;
  const ratio = template ? `${template.width} / ${template.height}` : undefined;
  const hasTemplate = Boolean(template);
  const hasMedia = Boolean(resolvedMedia?.url);
  const previewLabel = resolvedMedia?.id ? `Media ${resolvedMedia.id}` : 'Media preview';

  return (
    <Card className="h-full border-[var(--video-workspace-border)] bg-[var(--video-workspace-panel)]">
      <CardHeader className="flex-row items-center justify-between space-y-0 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--video-workspace-text)]">Preview</span>
          <Badge variant="secondary" className="text-[11px]">
            {hasBinding ? `${template?.width ?? '—'}x${template?.height ?? '—'}` : 'Unbound'}
          </Badge>
        </div>
        <Button size="sm" variant="secondary" onClick={onTogglePlayback} disabled={!hasBinding}>
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {!hasBinding ? (
          <div className="rounded-md border border-dashed border-[var(--video-workspace-border)] bg-[var(--video-workspace-muted)] p-4 text-xs text-[var(--video-workspace-text-muted)]">
            Preview binding is not available yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div
              className="flex items-center justify-center rounded-md border border-[var(--video-workspace-border)] bg-[var(--video-workspace-preview)] text-xs text-[var(--video-workspace-text-muted)]"
              style={{ aspectRatio: ratio }}
            >
              {!hasTemplate ? (
                'Select a template to preview'
              ) : isMediaLoading ? (
                'Loading media preview...'
              ) : hasMedia ? (
                resolvedMedia?.kind === VIDEO_MEDIA_KIND.IMAGE ? (
                  <img
                    src={resolvedMedia.url ?? ''}
                    alt={previewLabel}
                    className="h-full w-full rounded-md object-contain"
                  />
                ) : resolvedMedia?.kind === VIDEO_MEDIA_KIND.AUDIO ? (
                  <audio src={resolvedMedia?.url ?? ''} controls />
                ) : (
                  <video
                    src={resolvedMedia?.url ?? ''}
                    className="h-full w-full rounded-md object-contain"
                    controls
                  />
                )
              ) : (
                'No media binding resolved yet.'
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--video-workspace-text-muted)]">
              <span>Frame rate</span>
              <span>{template?.frameRate ? `${template.frameRate} fps` : '—'}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
