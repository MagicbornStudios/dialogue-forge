'use client';

import React, { useCallback } from 'react';
import type { VideoTemplate, VideoLayer } from '@/video/templates/types/video-template';
import type { VisualCanvasProps } from './VisualCanvas';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { VIDEO_TEMPLATES, type VideoTemplateDemo } from '@/video/templates/parameterized-templates';
import { cn } from '@/shared/lib/utils';

export interface ElementLibraryProps {
  className?: string;
  onAddElement?: (template: VideoTemplate, elementData: Partial<VideoLayer>) => void;
  template?: VideoTemplate | null;
  selectedTemplateId?: string | null;
}

export function ElementLibrary({
  className,
  onAddElement,
  template,
  selectedTemplateId,
}: ElementLibraryProps) {
  const handleAddElement = useCallback((template: VideoTemplate, elementData: Partial<VideoLayer>) => {
    if (!onAddElement || !template) return;

    // Create new layer based on element data
    const newLayer: VideoLayer = {
      id: `layer_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      kind: elementData.kind || 'text',
      name: elementData.name || 'New Element',
      startMs: 0,
      opacity: 1,
      visual: {
        x: 50,
        y: 50,
        width: elementData.width || 200,
        height: elementData.height || 100,
        rotation: 0,
        scale: 1,
        anchorX: 0.5,
        anchorY: 0.5,
      },
      style: elementData.style || {},
      inputs: elementData.inputs || {},
    };

    // Add to current template's first scene
    const updatedTemplate: VideoTemplate = {
      ...template,
      scenes: template.scenes.map((scene, index) => 
        index === 0
          ? {
              ...scene,
              layers: [...scene.layers, newLayer],
            }
          : scene
      ),
    };

    onAddElement(updatedTemplate);
  }, [onAddElement]);

  return (
    <Card className={cn('flex-1', className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--video-workspace-text)]">Element Library</span>
          <Badge variant="secondary" className="text-[11px]">
            {template ? 'Template active' : 'No template'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="text-sm text-[var(--video-workspace-text-muted)] mb-4">
          {template ? 'Click elements below to add to canvas' : 'Select a template to begin editing'}
        </div>

        {/* Template Showcase */}
        <div className="space-y-2">
          {Object.entries(VIDEO_TEMPLATES).map(([id, templateData]) => (
            <div key={id} className="group">
              <div className="flex items-center justify-between p-3 border border-[var(--video-workspace-border)] rounded cursor-pointer hover:bg-[var(--video-workspace-muted)] transition-colors"
                onClick={() => onAddElement(template, templateData)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[var(--video-workspace-panel)] rounded flex items-center justify-center text-white">
                    {React.createElement(templateData.component, { ...templateData.defaultProps, style: { width: 60, height: 40 } })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--video-workspace-text)]">{templateData.name}</div>
                    <div className="text-xs text-[var(--video-workspace-text-muted)]">{templateData.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-[11px]">
                    {template.component}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}