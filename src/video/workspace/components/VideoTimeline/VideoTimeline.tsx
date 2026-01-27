'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import type { VideoLayer } from '@/video/templates/types/video-layer';
import { VIDEO_LAYER_KIND } from '@/video/templates/types/video-layer';
import { cn } from '@/shared/lib/utils';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { assignLayersToTracks } from '../../utils/track-assignment';

interface VideoTimelineProps {
  template: VideoTemplate | null;
  currentFrame: number;
  isPlaying: boolean;
  selectedLayerId: string | null;
  onFrameChange: (frame: number) => void;
  onPlayToggle: () => void;
  onLayerSelect: (layerId: string | null) => void;
  onLayerStartChange?: (layerId: string, startMs: number) => void;
  onLayerDurationChange?: (layerId: string, durationMs: number) => void;
  onSceneDurationChange?: (sceneIndex: number, durationMs: number) => void;
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
  onLayerStartChange,
  onLayerDurationChange,
  onSceneDurationChange,
  className,
}: VideoTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [dragState, setDragState] = useState<{
    type: 'start' | 'duration' | 'move' | 'scene-duration' | null;
    layerId: string | null;
    sceneIndex: number | null;
    startX: number;
    initialStartMs: number;
    initialDurationMs: number;
  } | null>(null);

  const scene = template?.scenes[0];
  const allLayers = scene?.layers ?? [];
  const durationMs = scene?.durationMs ?? 5000;
  const frameRate = template?.frameRate ?? 30;
  const totalFrames = Math.ceil(durationMs / (1000 / frameRate));

  // Separate background layers from other layers
  const { backgroundLayers, regularLayers } = useMemo(() => {
    const backgrounds: VideoLayer[] = [];
    const regular: VideoLayer[] = [];
    allLayers.forEach(layer => {
      if (layer.kind === VIDEO_LAYER_KIND.BACKGROUND) {
        backgrounds.push(layer);
      } else {
        regular.push(layer);
      }
    });
    return { backgroundLayers: backgrounds, regularLayers: regular };
  }, [allLayers]);

  // Assign regular layers to tracks (background layers excluded)
  const trackAssignments = useMemo(() => {
    return assignLayersToTracks(regularLayers, durationMs);
  }, [regularLayers, durationMs]);

  // Group regular layers by track
  const layersByTrack = useMemo(() => {
    const grouped = new Map<number, VideoLayer[]>();
    regularLayers.forEach(layer => {
      const trackIndex = trackAssignments.get(layer.id) ?? 0;
      if (!grouped.has(trackIndex)) {
        grouped.set(trackIndex, []);
      }
      grouped.get(trackIndex)!.push(layer);
    });
    return grouped;
  }, [regularLayers, trackAssignments]);

  // Get max track index
  const maxTrackIndex = useMemo(() => {
    if (regularLayers.length === 0) return -1;
    return Math.max(...Array.from(trackAssignments.values()));
  }, [trackAssignments, regularLayers.length]);

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
    if (!isDraggingPlayhead && !dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;
      
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      
      if (isDraggingPlayhead) {
        // Playhead dragging
        const frame = Math.floor(percentage * totalFrames);
        onFrameChange(frame);
      } else if (dragState) {
        // Layer dragging - prevent background layers from being moved
        if (dragState.layerId) {
          const layer = allLayers.find(l => l.id === dragState.layerId);
          if (layer && layer.kind === VIDEO_LAYER_KIND.BACKGROUND) {
            // Don't allow dragging background layers
            return;
          }
        }
        
        const deltaX = x - dragState.startX;
        const deltaMs = (deltaX / rect.width) * durationMs;
        
        if (dragState.type === 'start' && dragState.layerId && onLayerStartChange) {
          const newStartMs = Math.max(0, dragState.initialStartMs + deltaMs);
          onLayerStartChange(dragState.layerId, newStartMs);
        } else if (dragState.type === 'duration' && dragState.layerId && onLayerDurationChange) {
          const newDurationMs = Math.max(1000, dragState.initialDurationMs + deltaMs);
          onLayerDurationChange(dragState.layerId, newDurationMs);
        } else if (dragState.type === 'move' && dragState.layerId && onLayerStartChange) {
          const newStartMs = Math.max(0, dragState.initialStartMs + deltaMs);
          onLayerStartChange(dragState.layerId, newStartMs);
        } else if (dragState.type === 'scene-duration' && dragState.sceneIndex !== null && onSceneDurationChange) {
          const newDurationMs = Math.max(1000, dragState.initialDurationMs + deltaMs);
          onSceneDurationChange(dragState.sceneIndex, newDurationMs);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
      setDragState(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, dragState, totalFrames, durationMs, onFrameChange, onLayerStartChange, onLayerDurationChange, onSceneDurationChange]);

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

      {/* Base Layer (background layer serves as base layer, or template duration control if no background) */}
      <div className="py-2 border-b border-border">
        <div className="relative h-6 mx-2">
          <div className="absolute inset-0 bg-[var(--video-timeline-bg)] rounded border border-border" />
          
          {backgroundLayers.length > 0 ? (
            // Use background layer as the base layer
            backgroundLayers.map((layer) => {
              const startPercent = ((layer.startMs ?? 0) / durationMs) * 100;
              const widthPercent = ((layer.durationMs ?? 1000) / durationMs) * 100;
              const isSelected = selectedLayerId === layer.id;

              return (
                <div
                  key={layer.id}
                  className={cn(
                    'absolute top-0 h-full',
                    isSelected && 'ring-1 ring-[var(--color-df-video)]'
                  )}
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerSelect(layer.id);
                  }}
                >
                  <div className="h-full bg-blue-500/20 border border-blue-500 rounded flex items-center px-2 text-xs font-medium text-blue-400">
                    {layer.name ?? 'Background'} (Template Duration)
                  </div>
                  {/* Right edge handle for duration control */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-blue-500/50 hover:bg-blue-500"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (!timelineRef.current || onSceneDurationChange === undefined) return;
                      const rect = timelineRef.current.getBoundingClientRect();
                      setDragState({
                        type: 'scene-duration',
                        layerId: null,
                        sceneIndex: 0,
                        startX: e.clientX - rect.left,
                        initialStartMs: 0,
                        initialDurationMs: durationMs,
                      });
                    }}
                  />
                </div>
              );
            })
          ) : (
            // No background layer - show template duration control
            <div
              className="absolute h-full bg-blue-500/20 border border-blue-500 rounded cursor-ew-resize"
              style={{ width: '100%' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (!timelineRef.current || onSceneDurationChange === undefined) return;
                const rect = timelineRef.current.getBoundingClientRect();
                setDragState({
                  type: 'scene-duration',
                  layerId: null,
                  sceneIndex: 0,
                  startX: e.clientX - rect.left,
                  initialStartMs: 0,
                  initialDurationMs: durationMs,
                });
              }}
            >
              <div className="h-full flex items-center px-2 text-xs font-medium text-blue-400">
                Base Layer (Template Duration)
              </div>
              {/* Right edge handle */}
              <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-blue-500/50 hover:bg-blue-500"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (!timelineRef.current || onSceneDurationChange === undefined) return;
                  const rect = timelineRef.current.getBoundingClientRect();
                  setDragState({
                    type: 'scene-duration',
                    layerId: null,
                    sceneIndex: 0,
                    startX: e.clientX - rect.left,
                    initialStartMs: 0,
                    initialDurationMs: durationMs,
                  });
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Layer Tracks */}
      <div className="flex-1 overflow-y-auto">
        {regularLayers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-xs text-muted-foreground">No layers yet</div>
          </div>
        ) : (
          <div className="py-2">
            {/* Render each track */}
            {Array.from({ length: maxTrackIndex + 1 }, (_, trackIndex) => {
              const trackLayers = layersByTrack.get(trackIndex) ?? [];
              
              return (
                <div key={trackIndex} className="relative mb-1">
                  {/* Track label */}
                  <div className="absolute left-0 -translate-x-full pr-2 h-8 flex items-center">
                    <div className="text-xs text-muted-foreground font-mono">
                      Track {trackIndex}
                    </div>
                  </div>
                  
                  {/* Track row */}
                  <div className="relative h-8 mx-2">
                    {/* Track background */}
                    <div className="absolute inset-0 bg-[var(--video-timeline-bg)] rounded border border-border" />
                    
                    {/* Render layers in this track */}
                    {trackLayers.map((layer) => {
                      const startPercent = ((layer.startMs ?? 0) / durationMs) * 100;
                      const widthPercent = ((layer.durationMs ?? 1000) / durationMs) * 100;
                      const isSelected = selectedLayerId === layer.id;

                      return (
                        <div
                          key={layer.id}
                          className={cn(
                            'absolute top-0 h-full group',
                            isSelected && 'ring-1 ring-[var(--color-df-video)]'
                          )}
                          style={{
                            left: `${startPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                        >
                          {/* Layer duration bar */}
                          <div
                            className={cn(
                              'h-full video-timeline-track transition-all cursor-move rounded',
                              isSelected && 'video-timeline-track-selected'
                            )}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              // Prevent dragging background layers
                              if (layer.kind === VIDEO_LAYER_KIND.BACKGROUND) {
                                onLayerSelect(layer.id);
                                return;
                              }
                              if (!timelineRef.current || onLayerStartChange === undefined) return;
                              const rect = timelineRef.current.getBoundingClientRect();
                              const barRect = e.currentTarget.getBoundingClientRect();
                              const localX = e.clientX - barRect.left;
                              const barWidth = barRect.width;
                              
                              // Check if clicking on edges (within 4px)
                              if (localX < 4) {
                                // Left edge - resize start
                                setDragState({
                                  type: 'start',
                                  layerId: layer.id,
                                  sceneIndex: null,
                                  startX: e.clientX - rect.left,
                                  initialStartMs: layer.startMs ?? 0,
                                  initialDurationMs: layer.durationMs ?? 1000,
                                });
                              } else if (localX > barWidth - 4) {
                                // Right edge - resize duration
                                setDragState({
                                  type: 'duration',
                                  layerId: layer.id,
                                  sceneIndex: null,
                                  startX: e.clientX - rect.left,
                                  initialStartMs: layer.startMs ?? 0,
                                  initialDurationMs: layer.durationMs ?? 1000,
                                });
                              } else {
                                // Middle - move layer
                                onLayerSelect(layer.id);
                                setDragState({
                                  type: 'move',
                                  layerId: layer.id,
                                  sceneIndex: null,
                                  startX: e.clientX - rect.left,
                                  initialStartMs: layer.startMs ?? 0,
                                  initialDurationMs: layer.durationMs ?? 1000,
                                });
                              }
                            }}
                          >
                            <div className="h-full flex items-center px-2 text-xs font-medium text-white truncate">
                              {layer.name ?? layer.id}
                            </div>
                            {/* Left edge handle */}
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize bg-white/20 hover:bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                // Prevent resizing background layers
                                if (layer.kind === VIDEO_LAYER_KIND.BACKGROUND) return;
                                if (!timelineRef.current || onLayerStartChange === undefined) return;
                                const rect = timelineRef.current.getBoundingClientRect();
                                setDragState({
                                  type: 'start',
                                  layerId: layer.id,
                                  sceneIndex: null,
                                  startX: e.clientX - rect.left,
                                  initialStartMs: layer.startMs ?? 0,
                                  initialDurationMs: layer.durationMs ?? 1000,
                                });
                              }}
                            />
                            {/* Right edge handle */}
                            <div
                              className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize bg-white/20 hover:bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                // Prevent resizing background layers
                                if (layer.kind === VIDEO_LAYER_KIND.BACKGROUND) return;
                                if (!timelineRef.current || onLayerDurationChange === undefined) return;
                                const rect = timelineRef.current.getBoundingClientRect();
                                setDragState({
                                  type: 'duration',
                                  layerId: layer.id,
                                  sceneIndex: null,
                                  startX: e.clientX - rect.left,
                                  initialStartMs: layer.startMs ?? 0,
                                  initialDurationMs: layer.durationMs ?? 1000,
                                });
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}