'use client';

import React, { useCallback } from 'react';
import type { VideoLayer } from '@/video/templates/types/video-layer';
import { VIDEO_LAYER_KIND } from '@/video/templates/types/video-layer';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { cn } from '@/shared/lib/utils';
import { Type, Move, Maximize2, RotateCw, Eye } from 'lucide-react';

interface PropertyInspectorProps {
  layer: VideoLayer | null;
  onUpdate: (layerId: string, updates: Partial<VideoLayer>) => void;
  className?: string;
}

export function PropertyInspector({
  layer,
  onUpdate,
  className,
}: PropertyInspectorProps) {
  const handleVisualUpdate = useCallback((field: string, value: number) => {
    if (!layer) return;
    onUpdate(layer.id, {
      visual: { ...layer.visual, [field]: value },
    });
  }, [layer, onUpdate]);

  const handleStyleUpdate = useCallback((field: string, value: any) => {
    if (!layer) return;
    onUpdate(layer.id, {
      style: { ...layer.style, [field]: value },
    });
  }, [layer, onUpdate]);

  const handleInputUpdate = useCallback((field: string, value: any) => {
    if (!layer) return;
    onUpdate(layer.id, {
      inputs: { ...layer.inputs, [field]: value },
    });
  }, [layer, onUpdate]);

  const handleNameUpdate = useCallback((value: string) => {
    if (!layer) return;
    onUpdate(layer.id, { name: value });
  }, [layer, onUpdate]);

  const handleOpacityUpdate = useCallback((value: number[]) => {
    if (!layer) return;
    onUpdate(layer.id, { opacity: value[0] / 100 });
  }, [layer, onUpdate]);

  if (!layer) {
    return (
      <div className={cn('flex items-center justify-center h-full p-4 text-center', className)}>
        <div className="text-sm text-muted-foreground">
          Select a layer to edit its properties
        </div>
      </div>
    );
  }

  const visual = layer.visual ?? {};
  const style = layer.style ?? {};
  const inputs = layer.inputs ?? {};

  return (
    <div className={cn('h-full overflow-y-auto video-property-inspector', className)}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 bg-background border-b border-border">
        <div className="text-sm font-semibold">Properties</div>
        <div className="text-xs text-muted-foreground mt-0.5">{layer.kind} Layer</div>
      </div>

      {/* Properties */}
      <div className="p-4 space-y-6">
        {/* Layer Name */}
        <div className="space-y-2">
          <Label className="video-property-label">Layer Name</Label>
          <Input
            value={layer.name ?? layer.id}
            onChange={(e) => handleNameUpdate(e.target.value)}
            className="text-sm"
          />
        </div>

        {/* Position Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Move size={14} className="text-[var(--color-df-video)]" />
            <span className="video-property-label">Position</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">X</Label>
              <Input
                type="number"
                value={Math.round(visual.x ?? 0)}
                onChange={(e) => handleVisualUpdate('x', parseFloat(e.target.value))}
                className="text-sm h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Y</Label>
              <Input
                type="number"
                value={Math.round(visual.y ?? 0)}
                onChange={(e) => handleVisualUpdate('y', parseFloat(e.target.value))}
                className="text-sm h-8"
              />
            </div>
          </div>
        </div>

        {/* Size Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Maximize2 size={14} className="text-[var(--color-df-video)]" />
            <span className="video-property-label">Size</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Width</Label>
              <Input
                type="number"
                value={Math.round(visual.width ?? 200)}
                onChange={(e) => handleVisualUpdate('width', parseFloat(e.target.value))}
                className="text-sm h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Height</Label>
              <Input
                type="number"
                value={Math.round(visual.height ?? 200)}
                onChange={(e) => handleVisualUpdate('height', parseFloat(e.target.value))}
                className="text-sm h-8"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <RotateCw size={14} className="text-[var(--color-df-video)]" />
            <span className="video-property-label">Rotation</span>
          </div>
          
          <div className="space-y-1">
            <Input
              type="range"
              value={visual.rotation ?? 0}
              onChange={(e) => handleVisualUpdate('rotation', parseFloat(e.target.value))}
              min={0}
              max={360}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-center text-muted-foreground">
              {Math.round(visual.rotation ?? 0)}°
            </div>
          </div>
        </div>

        {/* Opacity */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-[var(--color-df-video)]" />
            <span className="video-property-label">Opacity</span>
          </div>
          
          <div className="space-y-1">
            <Input
              type="range"
              value={(layer.opacity ?? 1) * 100}
              onChange={(e) => handleOpacityUpdate([parseFloat(e.target.value)])}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-center text-muted-foreground">
              {Math.round((layer.opacity ?? 1) * 100)}%
            </div>
          </div>
        </div>

        {/* Text-specific properties */}
        {layer.kind === VIDEO_LAYER_KIND.TEXT && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Type size={14} className="text-[var(--color-df-video)]" />
                <span className="video-property-label">Text Content</span>
              </div>
              
              <textarea
                value={inputs.content ?? ''}
                onChange={(e) => handleInputUpdate('content', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <span className="video-property-label">Font</span>
              
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Size</Label>
                  <Input
                    type="number"
                    value={style.fontSize ?? 32}
                    onChange={(e) => handleStyleUpdate('fontSize', parseFloat(e.target.value))}
                    className="text-sm h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Weight</Label>
                  <Select
                    value={style.fontWeight ?? 'normal'}
                    onValueChange={(value) => handleStyleUpdate('fontWeight', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="600">Semi Bold</SelectItem>
                      <SelectItem value="300">Light</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Color</Label>
                  <Input
                    type="color"
                    value={style.color ?? '#ffffff'}
                    onChange={(e) => handleStyleUpdate('color', e.target.value)}
                    className="h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Align</Label>
                  <Select
                    value={style.textAlign ?? 'center'}
                    onValueChange={(value) => handleStyleUpdate('textAlign', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Shape properties */}
        {(layer.kind === VIDEO_LAYER_KIND.RECTANGLE || 
          layer.kind === VIDEO_LAYER_KIND.CIRCLE ||
          layer.kind === VIDEO_LAYER_KIND.BACKGROUND) && (
          <div className="space-y-3">
            <span className="video-property-label">Fill</span>
            
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Background Color</Label>
              <Input
                type="color"
                value={style.backgroundColor ?? '#3b82f6'}
                onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
                className="h-8"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
