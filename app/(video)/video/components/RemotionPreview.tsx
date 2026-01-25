'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import type { VideoComposition } from '@/video/templates/types/video-composition';
import { mapVideoCompositionToDTO } from '@/app/lib/video/map-composition';
import { RemotionVideoComposition } from '@/app/lib/video/remotion-root';
import { VIDEO_RENDER_FORMAT } from '@/app/lib/video/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';

interface RemotionPreviewProps {
  composition?: VideoComposition | null;
  errorMessage?: string | null;
  isPlaying: boolean;
  currentFrame: number;
  onFrameChange: (frame: number) => void;
  onSetPlaying: (playing: boolean) => void;
}

const toFrameCount = (durationMs: number, fps: number) => Math.max(1, Math.ceil((durationMs / 1000) * fps));

export function RemotionPreview({
  composition,
  errorMessage,
  isPlaying,
  currentFrame,
  onFrameChange,
  onSetPlaying,
}: RemotionPreviewProps) {
  const playerRef = useRef<PlayerRef>(null);
  const hasComposition = Boolean(composition);

  const renderInputProps = useMemo(() => {
    if (!composition) return null;
    return {
      composition: mapVideoCompositionToDTO(composition),
      settings: {
        fps: composition.frameRate,
        width: composition.width,
        height: composition.height,
        format: VIDEO_RENDER_FORMAT.MP4,
      },
    };
  }, [composition]);

  const durationInFrames = useMemo(() => {
    if (!composition) return 1;
    return toFrameCount(composition.durationMs, composition.frameRate);
  }, [composition]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !hasComposition) return;
    if (player.getCurrentFrame() === currentFrame) return;
    player.seekTo(currentFrame);
  }, [currentFrame, hasComposition]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const handleFrameUpdate = ({ detail }: { detail: { frame: number } }) => {
      onFrameChange(detail.frame);
    };

    const handlePlay = () => {
      onSetPlaying(true);
    };

    const handlePause = () => {
      onSetPlaying(false);
    };

    player.addEventListener('frameupdate', handleFrameUpdate);
    player.addEventListener('play', handlePlay);
    player.addEventListener('pause', handlePause);

    return () => {
      player.removeEventListener('frameupdate', handleFrameUpdate);
      player.removeEventListener('play', handlePlay);
      player.removeEventListener('pause', handlePause);
    };
  }, [onFrameChange, onSetPlaying]);

  const handleScrub = (frame: number) => {
    onSetPlaying(false);
    onFrameChange(frame);
  };

  const scrubValue = Math.min(Math.max(currentFrame, 0), durationInFrames - 1);
  const playbackLabel = composition
    ? `${(scrubValue / composition.frameRate).toFixed(2)}s / ${(durationInFrames / composition.frameRate).toFixed(2)}s`
    : '0.00s / 0.00s';

  return (
    <Card className="h-full border-[var(--video-workspace-border)] bg-[var(--video-workspace-panel)]">
      <CardHeader className="flex-row items-center justify-between space-y-0 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--video-workspace-text)]">Remotion Preview</span>
          <Badge variant="secondary" className="text-[11px]">
            {composition ? `${composition.width}x${composition.height}` : 'Unbound'}
          </Badge>
        </div>
        <Button size="sm" variant="secondary" onClick={() => onSetPlaying(!isPlaying)} disabled={!hasComposition}>
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-4 px-4 pb-4">
        {!hasComposition ? (
          <div className="rounded-md border border-dashed border-[var(--video-workspace-border)] bg-[var(--video-workspace-muted)] p-4 text-xs text-[var(--video-workspace-text-muted)]">
            {errorMessage ?? 'Compile a template to preview the Remotion output.'}
          </div>
        ) : (
          <div className="flex h-full flex-col gap-4">
            <div
              className="flex min-h-[280px] flex-1 items-center justify-center rounded-md border border-[var(--video-workspace-border)] bg-[var(--video-workspace-preview)]"
              style={{ aspectRatio: composition ? `${composition.width} / ${composition.height}` : undefined }}
            >
              {renderInputProps ? (
                <Player
                  ref={playerRef}
                  component={RemotionVideoComposition}
                  durationInFrames={durationInFrames}
                  compositionWidth={composition.width}
                  compositionHeight={composition.height}
                  fps={composition.frameRate}
                  inputProps={renderInputProps}
                  controls={false}
                  autoPlay={false}
                  initialFrame={scrubValue}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <div className="text-xs text-[var(--video-workspace-text-muted)]">Preparing preview...</div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-[var(--video-workspace-text-muted)]">
                <span>Timeline</span>
                <span>{playbackLabel}</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(durationInFrames - 1, 0)}
                value={scrubValue}
                onChange={(event) => handleScrub(Number(event.target.value))}
                className="h-2 w-full cursor-pointer accent-primary"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
