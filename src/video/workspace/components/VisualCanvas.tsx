'use client';

import React, { useState, useRef, useCallback } from 'react';
import type { VideoTemplate, VideoLayer } from '@/video/templates/types/video-template';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { cn } from '@/shared/lib/utils';

interface CanvasElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VisualCanvasProps {
  className?: string;
  template?: VideoTemplate;
  selectedLayerId?: string;
  onLayerSelect?: (layerId: string) => void;
  onLayerUpdate?: (layerId: string, updates: Partial<VideoLayer>) => void;
}

export function VisualCanvas({
  className,
  template,
  selectedLayerId,
  onLayerSelect,
  onLayerUpdate,
}: VisualCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<CanvasElementPosition>({ x: 0, y: 0 });

  const layers = template?.scenes[0]?.layers || [];

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === canvasRef.current) {
      onLayerSelect?.('');
    }
  }, [onLayerSelect]);

  const handleLayerClick = useCallback((layer: VideoLayer, e: React.MouseEvent) => {
    e.stopPropagation();
    onLayerSelect?.(layer.id);
  }, [onLayerSelect]);

  const handleMouseDown = useCallback((layer: VideoLayer, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedLayer(layer.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - (layer.visual?.x || 0),
        y: e.clientY - rect.top - (layer.visual?.y || 0),
      });
    }
  }, [layers, selectedLayerId]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedLayer || !canvasRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    onLayerUpdate?.(draggedLayer, {
      visual: {
        ...(layers.find(l => l.id === draggedLayer)?.visual || {}),
        x: Math.max(0, newX),
        y: Math.max(0, newY),
      }
    });
  }, [isDragging, draggedLayer, layers, onLayerUpdate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedLayer(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const renderLayer = useCallback((layer: VideoLayer) => {
    const isSelected = selectedLayerId === layer.id;
    const x = layer.visual?.x || 0;
    const y = layer.visual?.y || 0;
    const width = layer.visual?.width || 200;
    const height = layer.visual?.height || 100;
    const rotation = layer.visual?.rotation || 0;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      cursor: isDragging && selectedLayerId === layer.id ? 'grabbing' : 'pointer',
      border: isSelected ? '2px solid oklch(0.65 0.20 30)' : '2px solid transparent',
      borderRadius: '4px',
      backgroundColor: layer.visual?.backgroundColor || '#3b82f6',
      opacity: layer.opacity !== undefined ? layer.opacity : 1,
      userSelect: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: layer.visual?.fontFamily || 'system-ui',
      fontSize: layer.visual?.fontSize ? `${layer.visual.fontSize}px` : '16px',
      fontWeight: layer.visual?.fontWeight || 'normal',
      color: layer.visual?.color || '#ffffff',
      textShadow: '0px 2px 4px rgba(0,0,0,0.3)',
      padding: '8px',
      transform: `rotate(${rotation}deg)`,
    };

    const renderContent = useCallback(() => {
      switch (layer.kind) {
        case 'text':
          return layer.inputs?.content || 'Text Layer';
        case 'background':
          return 'Background';
        case 'image':
          return 'Image';
        case 'rectangle':
          return 'Rectangle';
        case 'circle':
          return 'Circle';
        case 'video':
          return 'Video';
        default:
          return layer.kind;
      }
    }, [layer]);

    return (
      <Card className={cn('flex-1', className)}>
        <CardHeader className="flex-row items-center justify-between space-y-0 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--video-workspace-text)]">Visual Canvas</span>
            <div className="text-xs text-[var(--video-workspace-text-muted)]">Drag layers to reposition</div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div
            className="relative w-full h-full min-h-[400px] bg-white border-2 border-gray-200 rounded"
            style={{ aspectRatio: template ? `${template.width}/${template.height}` : '16/9' }}
          >
            {layers.map((layer) => (
              <div
                key={layer.id}
                style={renderLayer(layer)}
                onClick={(e) => handleLayerClick(layer, e)}
                onMouseDown={(e) => handleMouseDown(layer, e)}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {layer.name || layer.kind} ({layer.id})
                </div>
                <div className="text-sm text-gray-700 font-mono">
                  {renderContent()}
                </div>
              </div>
            ))}
          </div>

          {isDragging && draggedLayer && (
            <div
              className="absolute top-0 left-0 w-20 h-20 bg-blue-500 text-white text-xs rounded pointer-events-none flex items-center justify-center z-50"
              style={{
                left: Math.max(0, Math.min(100, dragOffset.x + (layers.find(l => l.id === draggedLayer)?.visual?.x || 0))),
                top: Math.max(0, Math.min(100, dragOffset.y + (layers.find(l => l.id === draggedLayer)?.visual?.y || 0))),
              }}
            >
              {layers.find(l => l.id === draggedLayer)?.name || 'Layer'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}