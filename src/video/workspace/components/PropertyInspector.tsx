'use client';

import React from 'react';
import type { VideoLayer, VideoLayerVisualProperties, VideoLayerStyleProperties } from '@/video/templates/types/video-layer';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

export interface PropertyInspectorProps {
  layer?: VideoLayer | null;
  onUpdate?: (layerId: string, updates: Partial<VideoLayer>) => void;
}

export function PropertyInspector({ layer, onUpdate }: PropertyInspectorProps) {
  if (!layer) {
    return (
      <Card className="w-full">
        <CardHeader className="flex-row items-center justify-between space-y-0 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--video-workspace-text)]">Properties</span>
            <Badge variant="secondary" className="text-[11px]">
              No layer selected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="text-xs text-[var(--video-workspace-text-muted)] mb-4">
            No layer selected
          </div>
          <div className="text-xs text-[var(--video-workspace-text-muted)]">
            Use the canvas to position and resize elements
          </div>
        </CardContent>
      </Card>
    );
  }

  const PropertyField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">
        {label}
      </div>
      <div className="flex items-center gap-2">
        {children}
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex-row items-center justify-between space-y-0 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--video-workspace-text)]">Properties</span>
          <Badge variant="secondary" className="text-[11px]">
            {layer.kind ? 'Layer selected' : 'No layer selected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <PropertyField
          label="Position"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 text-[var(--video-workspace-text)]">
              X:
            </div>
            <div className="w-20 text-right text-[var(--video-workspace-text)]">
              {layer.visual?.x ?? 0}
            </div>
            <div className="w-20 text-[var(--video-workspace-text)]">
              Y:
            </div>
            <div className="w-20 text-right text-[var(--video-workspace-text)]">
              {layer.visual?.y ?? 0}
            </div>
          </div>
        </PropertyField>
      
        <PropertyField
          label="Size"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 text-[var(--video-workspace-text)]">
              Width:
            </div>
            <div className="w-20 text-right text-[var(--video-workspace-text)]">
              {layer.visual?.width ?? 200}
            </div>
            <div className="w-20 text-[var(--video-workspace-text)]">
              Height:
            </div>
            <div className="w-20 text-right text-[var(--video-workspace-text)]">
              {layer.visual?.height ?? 100}
            </div>
          </div>
        </PropertyField>
      
        <PropertyField
          label="Style"
        >
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">
              Background
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={layer.visual?.backgroundColor || '#3b82f6'}
                onChange={(e) => onUpdate?.(layer.id, { visual: { backgroundColor: e.target.value } })}
                className="w-full h-8 rounded border border-gray-300 px-2"
              />
            </div>
          </div>
        </PropertyField>
      
        <PropertyField
          label="Transform"
        >
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">
              Rotation
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={360}
                value={layer.visual?.rotation || 0}
                onChange={(e) => onUpdate?.(layer.id, { visual: { rotation: Number(e.target.value) } })}
                className="w-full h-8 rounded border border-gray-300 px-2"
              />
            </div>
          </div>
        </PropertyField>
      
        <PropertyField
          label="Appearance"
        >
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">
              Font
            </div>
            <div className="flex items-center gap-2">
              <select
                value={layer.visual?.fontFamily || 'system-ui'}
                onChange={(e) => onUpdate?.(layer.id, { visual: { fontFamily: e.target.value } })}
                className="w-full h-8 rounded border border-gray-300 px-2"
              >
                <option value="system-ui">System UI</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
              </select>
            </div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">
              Size
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={8}
                max={72}
                value={layer.visual?.fontSize || 16}
                onChange={(e) => onUpdate?.(layer.id, { visual: { fontSize: Number(e.target.value) } })}
                className="w-full h-8 rounded border border-gray-300 px-2"
              />
            </div>
          </div>
        </PropertyField>
      
        <PropertyField
          label="Effects"
        >
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">
              Opacity
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={layer.opacity !== undefined ? layer.opacity : 1}
                onChange={(e) => onUpdate?.(layer.id, { opacity: Number(e.target.value) })}
                className="w-full h-8 rounded border border-gray-300 px-2"
              />
            </div>
          </div>
        </PropertyField>
      </CardContent>
    </Card>
  );
}