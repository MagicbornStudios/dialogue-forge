'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import type { VideoLayer } from '@/video/templates/types/video-layer';
import type { VideoLayerKind } from '@/video/templates/types/video-layer';
import { VideoLayerRenderer } from './VideoLayerRenderer';
import { useElementDrag } from '../../hooks/useElementDrag';
import { cn } from '@/shared/lib/utils';
import { findAvailableTrack } from '../../utils/track-assignment';

export interface VideoCanvasProps {
  template: VideoTemplate | null;
  selectedLayerId: string | null;
  showGrid?: boolean;
  zoom?: number;
  readonly?: boolean;
  currentFrame?: number;
  frameRate?: number;
  onLayerSelect: (layerId: string | null) => void;
  onLayerMove: (layerId: string, x: number, y: number) => void;
  onLayerResize: (layerId: string, width: number, height: number) => void;
  onLayerAdd: (layer: Partial<VideoLayer>) => void;
  className?: string;
}

export function VideoCanvas({
  template,
  selectedLayerId,
  showGrid = true,
  zoom = 1,
  readonly = false,
  currentFrame = 0,
  frameRate = 30,
  onLayerSelect,
  onLayerMove,
  onLayerResize,
  onLayerAdd,
  className,
}: VideoCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const { draggedElementType, setDraggedElementType } = useElementDrag();

  // Get first scene's layers (for now, we'll support single-scene templates)
  const allLayers = template?.scenes[0]?.layers ?? [];
  const templateWidth = template?.width ?? 1920;
  const templateHeight = template?.height ?? 1080;
  
  // Calculate current time in milliseconds
  const currentTimeMs = useMemo(() => {
    return (currentFrame / frameRate) * 1000;
  }, [currentFrame, frameRate]);
  
  // Filter layers to only show those visible at the current frame
  const layers = useMemo(() => {
    return allLayers.filter(layer => {
      const layerStart = layer.startMs ?? 0;
      const layerDuration = layer.durationMs ?? 1000;
      const layerEnd = layerStart + layerDuration;
      return currentTimeMs >= layerStart && currentTimeMs < layerEnd;
    });
  }, [allLayers, currentTimeMs]);

  // Calculate canvas display size based on available space and zoom
  const [canvasScale, setCanvasScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth - 64; // Padding
    const containerHeight = containerRef.current.clientHeight - 64;
    
    const scaleX = containerWidth / templateWidth;
    const scaleY = containerHeight / templateHeight;
    const fitScale = Math.min(scaleX, scaleY, 1) * (zoom ?? 1);
    
    setCanvasScale(fitScale);
  }, [templateWidth, templateHeight, zoom]);
  
  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth - 64;
      const containerHeight = containerRef.current.clientHeight - 64;
      
      const scaleX = containerWidth / templateWidth;
      const scaleY = containerHeight / templateHeight;
      const fitScale = Math.min(scaleX, scaleY, 1) * (zoom ?? 1);
      
      setCanvasScale(fitScale);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [templateWidth, templateHeight, zoom]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (readonly) return;
    // Click on canvas background - deselect
    if (e.target === e.currentTarget) {
      onLayerSelect(null);
    }
  }, [readonly, onLayerSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (readonly) return;
    e.preventDefault();
    
    console.log('🎨 Canvas drop event:', { draggedElementType, hasCanvas: !!canvasRef.current });
    
    if (!draggedElementType || !canvasRef.current || !template) {
      console.warn('❌ Drop cancelled - no element type or canvas ref or template');
      return;
    }
    
    // Get drop position relative to canvas (in template coordinates)
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvasScale;
    const y = (e.clientY - rect.top) / canvasScale;
    
    const width = draggedElementType === 'text' ? 400 : 200;
    const height = draggedElementType === 'text' ? 100 : 200;
    
    // Position element at drop position (anchor 0, 0 = top-left corner)
    const dropX = Math.round(x);
    const dropY = Math.round(y);
    
    // Calculate start time based on current frame
    const defaultDurationMs = 1000; // 1 second default
    const dropStartMs = currentTimeMs;
    
    // Find available track for the new layer
    const scene = template.scenes[0];
    const existingLayers = scene?.layers ?? [];
    const availableTrack = findAvailableTrack(
      existingLayers,
      dropStartMs,
      defaultDurationMs
    );
    
    // Create new layer
    const newLayer: Partial<VideoLayer> = {
      id: `layer_${Date.now()}`,
      name: `${draggedElementType} Layer`,
      kind: draggedElementType,
      startMs: dropStartMs,
      durationMs: defaultDurationMs,
      opacity: 1,
      visual: {
        x: dropX,
        y: dropY,
        width,
        height,
        rotation: 0,
        scale: 1,
        anchorX: 0, // Top-left corner
        anchorY: 0,
      },
      style: {
        backgroundColor: draggedElementType === 'text' ? 'transparent' : '#3b82f6',
        color: '#ffffff',
        fontSize: 32,
        fontFamily: 'system-ui',
        fontWeight: 'bold',
        textAlign: 'center',
      },
      inputs: draggedElementType === 'text' ? {
        content: 'New Text',
      } : undefined,
    };
    
    console.log('🎨 Calling onLayerAdd with:', newLayer, 'availableTrack:', availableTrack);
    onLayerAdd(newLayer);
    
    console.log('🎨 Clearing drag state');
    setDraggedElementType(null);
  }, [draggedElementType, canvasScale, template, currentTimeMs, onLayerAdd, setDraggedElementType]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  if (!template) {
    return (
      <div className={cn('flex items-center justify-center h-full w-full bg-[var(--video-canvas-bg)]', className)}>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">No template loaded</div>
          <div className="text-xs text-muted-foreground mt-2">
            Select a template from the sidebar to get started
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        'flex items-center justify-center h-full w-full overflow-auto',
        'bg-[var(--video-canvas-bg)]',
        showGrid && 'video-canvas-grid',
        className
      )}
      onClick={handleCanvasClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Canvas container */}
      <div
        ref={canvasRef}
        className="relative video-canvas border border-[var(--video-canvas-border)] shadow-lg"
        style={{
          width: `${templateWidth * canvasScale}px`,
          height: `${templateHeight * canvasScale}px`,
          transformOrigin: 'center',
        }}
      >
        {/* Template info overlay */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/50 text-white text-xs font-mono z-50 pointer-events-none">
          {template.name} • {templateWidth}×{templateHeight} • {Math.round(canvasScale * 100)}%
        </div>

        {/* Render layers */}
        {layers.map((layer, index) => (
          <VideoLayerRenderer
            key={layer.id}
            layer={layer}
            layerIndex={index}
            scale={canvasScale}
            isSelected={selectedLayerId === layer.id}
            onSelect={() => onLayerSelect(layer.id)}
            onMove={(x: number, y: number) => onLayerMove(layer.id, x, y)}
            onResize={(width: number, height: number) => onLayerResize(layer.id, width, height)}
          />
        ))}

        {/* Drop zone indicator */}
        {draggedElementType && (
          <div className="absolute inset-0 border-2 border-dashed border-[var(--color-df-video)] bg-[var(--color-df-video)]/5 pointer-events-none flex items-center justify-center">
            <div className="px-4 py-2 rounded bg-[var(--color-df-video-bg)] text-[var(--color-df-video)] text-sm font-medium pointer-events-none">
              Drop to add {draggedElementType} layer
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
