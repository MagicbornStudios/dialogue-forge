'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import type { VideoLayer } from '@/video/templates/types/video-layer';
import { cn } from '@/shared/lib/utils';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface VideoTimelineProps {
  template: VideoTemplate | null;
  currentFrame: number;
  isPlaying: boolean;
  selectedLayerId: string | null;
  onFrameChange: (frame: number) => void;
  onPlayToggle: () => void;
  onLayerSelect: (layerId: string | null) => void;
  className?: string;
}

export function VideoTimeline({
  template,
  currentFrame,
  isPlaying,
  selectedLayerId,
  onFrameChange,
  onPlayToggle,
  onLayerSelect,
  className,
}: VideoTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  const scene = template?.scenes[0];
  const layers = scene?.layers ?? [];
  const durationMs = scene?.durationMs ?? 5000;
  const frameRate = template?.frameRate ?? 30;
  const totalFrames = Math.ceil(durationMs / (1000 / frameRate));

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      onFrameChange((currentFrame + 1) % totalFrames);
    }, 1000 / frameRate);

    return () => clearInterval(interval);
  }, [isPlaying, currentFrame, totalFrames, frameRate, onFrameChange]);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const frame = Math.floor(percentage * totalFrames);
    
    onFrameChange(Math.max(0, Math.min(totalFrames - 1, frame)));
  }, [totalFrames, onFrameChange]);

  const handlePlayheadDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingPlayhead(true);
  }, []);

  useEffect(() => {
    if (!isDraggingPlayhead) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;
      
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const frame = Math.floor(percentage * totalFrames);
      
      onFrameChange(frame);
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, totalFrames, onFrameChange]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 100);
    return `${seconds}.${milliseconds}s`;
  };

  if (!template) {
    return (
      <div className={cn('h-full bg-[var(--video-timeline-bg)] flex items-center justify-center', className)}>
        <div className="text-xs text-muted-foreground">No template loaded</div>
      </div>
    );
  }

  const playheadPosition = (currentFrame / totalFrames) * 100;
  const currentTimeMs = (currentFrame / frameRate) * 1000;

  return (
    <div className={cn('h-full flex flex-col bg-[var(--video-timeline-bg)] video-timeline', className)}>
      {/* Timeline Header */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onPlayToggle}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </Button>
        
        <div className="text-xs font-mono text-muted-foreground">
          {formatTime(currentTimeMs)} / {formatTime(durationMs)}
        </div>
        
        <div className="text-xs font-mono text-muted-foreground">
          Frame: {currentFrame} / {totalFrames}
        </div>
      </div>

      {/* Timeline Ruler */}
      <div
        ref={timelineRef}
        className="relative h-8 border-b border-[var(--video-timeline-ruler)] cursor-pointer video-timeline-ruler"
        onClick={handleTimelineClick}
      >
        {/* Time markers */}
        {[0, 0.25, 0.5, 0.75, 1].map((position) => {
          const time = durationMs * position;
          return (
            <div
              key={position}
              className="absolute top-0 h-full flex flex-col items-center justify-end pb-1"
              style={{ left: `${position * 100}%` }}
            >
              <div className="h-2 w-px bg-[var(--video-timeline-ruler)]" />
              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                {formatTime(time)}
              </div>
            </div>
          );
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 h-full w-0.5 video-timeline-playhead cursor-ew-resize z-20"
          style={{ left: `${playheadPosition}%` }}
          onMouseDown={handlePlayheadDragStart}
        >
          <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-[var(--video-timeline-playhead)]" />
        </div>
      </div>

      {/* Layer Tracks */}
      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-xs text-muted-foreground">No layers yet</div>
          </div>
        ) : (
          <div className="py-2">
            {layers.map((layer, index) => {
              const startPercent = ((layer.startMs ?? 0) / durationMs) * 100;
              const widthPercent = ((layer.durationMs ?? durationMs) / durationMs) * 100;
              const isSelected = selectedLayerId === layer.id;

              return (
                <div
                  key={layer.id}
                  className={cn(
                    'relative h-8 mx-2 mb-1 cursor-pointer group',
                    isSelected && 'ring-1 ring-[var(--color-df-video)]'
                  )}
                  onClick={() => onLayerSelect(layer.id)}
                >
                  {/* Layer track background */}
                  <div className="absolute inset-0 bg-[var(--video-timeline-bg)] rounded border border-border" />
                  
                  {/* Layer duration bar */}
                  <div
                    className={cn(
                      'absolute h-full video-timeline-track transition-all',
                      isSelected && 'video-timeline-track-selected'
                    )}
                    style={{
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                  >
                    <div className="h-full flex items-center px-2 text-xs font-medium text-white truncate">
                      {layer.name ?? layer.id}
                    </div>
                  </div>

                  {/* Layer name on left */}
                  <div className="absolute left-0 -translate-x-full pr-2 h-full flex items-center">
                    <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                      {layer.name ?? layer.id}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );