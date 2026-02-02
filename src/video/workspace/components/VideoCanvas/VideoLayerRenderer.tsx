'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { VideoLayer } from '@/video/templates/types/video-layer';
import { VIDEO_LAYER_KIND } from '@/video/templates/types/video-layer';
import { cn } from '@/shared/lib/utils';

interface VideoLayerRendererProps {
  layer: VideoLayer;
  layerIndex: number;
  scale: number;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
}

export function VideoLayerRenderer({
  layer,
  layerIndex,
  scale,
  isSelected,
  onSelect,
  onMove,
  onResize,
}: VideoLayerRendererProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const visual = layer.visual ?? {};
  const style = layer.style ?? {};
  
  const x = visual.x ?? 0;
  const y = visual.y ?? 0;
  const width = visual.width ?? 200;
  const height = visual.height ?? 200;
  const rotation = visual.rotation ?? 0;
  const opacity = layer.opacity ?? 1;
  const anchorX = visual.anchorX ?? 0; // Default to top-left corner
  const anchorY = visual.anchorY ?? 0;
  
  // Calculate position accounting for anchor point
  // Anchor 0, 0 means top-left corner, so x and y are the top-left position
  // For other anchors, we offset by the anchor ratio
  const displayX = x - (width * anchorX);
  const displayY = y - (height * anchorY);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Always select on mouse down
    onSelect();
    
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX / scale - x,
        y: e.clientY / scale - y,
      });
    }
  }, [scale, x, y, onSelect]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width,
      height,
    });
  }, [width, height]);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX / scale - dragStart.x;
        const newY = e.clientY / scale - dragStart.y;
        onMove(Math.round(newX), Math.round(newY));
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newWidth = Math.max(20, resizeStart.width + deltaX / scale);
        const newHeight = Math.max(20, resizeStart.height + deltaY / scale);
        onResize(Math.round(newWidth), Math.round(newHeight));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, scale, dragStart, resizeStart, onMove, onResize]);

  const renderLayerContent = () => {
    const content = layer.inputs?.content ?? '';
    
    switch (layer.kind) {
      case VIDEO_LAYER_KIND.TEXT:
        return (
          <div
            className="w-full h-full flex items-center justify-center px-2 overflow-hidden"
            style={{
              fontFamily: style.fontFamily ?? 'system-ui',
              fontSize: `${style.fontSize ?? 32}px`,
              fontWeight: style.fontWeight ?? 'bold',
              color: style.color ?? '#ffffff',
              textAlign: style.textAlign ?? 'center',
              lineHeight: style.lineHeight ?? 1.2,
              letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
            }}
          >
            {content}
          </div>
        );
      
      case VIDEO_LAYER_KIND.RECTANGLE:
        return (
          <div className="w-full h-full flex items-center justify-center text-xs text-white/50 font-mono">
            Rectangle
          </div>
        );
      
      case VIDEO_LAYER_KIND.CIRCLE:
        return (
          <div className="w-full h-full flex items-center justify-center text-xs text-white/50 font-mono">
            Circle
          </div>
        );
      
      case VIDEO_LAYER_KIND.IMAGE:
        return (
          <div className="w-full h-full flex items-center justify-center text-xs text-white/50 font-mono">
            Image
          </div>
        );
      
      case VIDEO_LAYER_KIND.VIDEO:
        return (
          <div className="w-full h-full flex items-center justify-center text-xs text-white/50 font-mono">
            Video
          </div>
        );
      
      case VIDEO_LAYER_KIND.BACKGROUND:
        return (
          <div className="w-full h-full flex items-center justify-center text-xs text-white/50 font-mono">
            Background
          </div>
        );
      
      default:
        return (
          <div className="w-full h-full flex items-center justify-center text-xs text-white/50 font-mono">
            {layer.kind}
          </div>
        );
    }
  };

  return (
    <div
      ref={layerRef}
      className={cn(
        'absolute cursor-move transition-shadow',
        isSelected && 'video-layer-selected',
        !isSelected && 'video-layer-hover',
        isDragging && 'cursor-grabbing'
      )}
      style={{
        left: `${displayX * scale}px`,
        top: `${displayY * scale}px`,
        width: `${width * scale}px`,
        height: `${height * scale}px`,
        zIndex: layerIndex + 1,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: `${anchorX * 100}% ${anchorY * 100}%`,
        opacity,
        backgroundColor: style.backgroundColor ?? 'transparent',
        borderColor: style.borderColor,
        borderWidth: style.borderWidth ? `${style.borderWidth}px` : undefined,
        borderRadius: layer.kind === VIDEO_LAYER_KIND.CIRCLE 
          ? '50%' 
          : style.borderRadius 
          ? `${style.borderRadius}px` 
          : undefined,
      }}
      onMouseDown={handleMouseDown}
    >
      {renderLayerContent()}
      
      {/* Layer name badge */}
      <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/70 text-white pointer-events-none whitespace-nowrap">
        {layer.name ?? layer.id}
      </div>

      {/* Resize handles (only show when selected) */}
      {isSelected && (
        <>
          <div
            className="video-resize-handle"
            style={{
              right: '-4px',
              bottom: '-4px',
              cursor: 'nwse-resize',
            }}
            onMouseDown={handleResizeMouseDown}
          />
          <div
            className="video-resize-handle"
            style={{
              right: '-4px',
              top: '-4px',
              cursor: 'nesw-resize',
            }}
          />
          <div
            className="video-resize-handle"
            style={{
              left: '-4px',
              bottom: '-4px',
              cursor: 'nesw-resize',
            }}
          />
          <div
            className="video-resize-handle"
            style={{
              left: '-4px',
              top: '-4px',
              cursor: 'nwse-resize',
            }}
          />
        </>
      )}
    </div>
  );
}
