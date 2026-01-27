'use client';

import React from 'react';
import { Type, Square, Circle, Image, Film, Shapes } from 'lucide-react';
import { useVideoWorkspaceStore } from '../../store/video-workspace-store';
import { useElementDrag } from '../../hooks/useElementDrag';
import { VIDEO_LAYER_KIND, type VideoLayerKind } from '@/video/templates/types/video-layer';
import { cn } from '@/shared/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';

interface ElementInfo {
  kind: VideoLayerKind;
  label: string;
  icon: React.ReactNode;
  category: 'text' | 'shape' | 'media';
  description: string;
}

const ELEMENT_INFO: Record<string, ElementInfo> = {
  text: {
    kind: VIDEO_LAYER_KIND.TEXT,
    label: 'Text',
    icon: <Type size={14} />,
    category: 'text',
    description: 'Add text layer',
  },
  rectangle: {
    kind: VIDEO_LAYER_KIND.RECTANGLE,
    label: 'Rectangle',
    icon: <Square size={14} />,
    category: 'shape',
    description: 'Add rectangle shape',
  },
  circle: {
    kind: VIDEO_LAYER_KIND.CIRCLE,
    label: 'Circle',
    icon: <Circle size={14} />,
    category: 'shape',
    description: 'Add circle shape',
  },
  image: {
    kind: VIDEO_LAYER_KIND.IMAGE,
    label: 'Image',
    icon: <Image size={14} />,
    category: 'media',
    description: 'Add image layer',
  },
  video: {
    kind: VIDEO_LAYER_KIND.VIDEO,
    label: 'Video',
    icon: <Film size={14} />,
    category: 'media',
    description: 'Add video layer',
  },
};

interface ElementPaletteProps {
  className?: string;
}

export function ElementPalette({ className }: ElementPaletteProps) {
  const { setDraggedElementType } = useElementDrag();

  const handleDragStart = (e: React.DragEvent, elementKind: VideoLayerKind) => {
    setDraggedElementType(elementKind);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/video-element', elementKind);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedElementType(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const renderCategory = (category: string, elements: ElementInfo[]) => {
    if (elements.length === 0) return null;

    const categoryLabels: Record<string, string> = {
      text: 'Text',
      shape: 'Shapes',
      media: 'Media',
    };

    return (
      <div key={category} className="mb-3">
        <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {categoryLabels[category]}
        </div>
        <div className="space-y-0.5">
          {elements.map((elementInfo) => (
            <TooltipProvider key={elementInfo.kind}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, elementInfo.kind)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 text-xs cursor-grab active:cursor-grabbing',
                      'text-muted-foreground hover:bg-muted hover:text-foreground',
                      'transition-colors rounded'
                    )}
                  >
                    <div className="shrink-0" style={{ color: 'var(--color-df-video)' }}>
                      {elementInfo.icon}
                    </div>
                    <span className="font-medium">{elementInfo.label}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{elementInfo.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    );
  };

  // Group elements by category
  const groupedElements: Record<string, ElementInfo[]> = {
    text: [],
    shape: [],
    media: [],
  };

  Object.values(ELEMENT_INFO).forEach((element) => {
    groupedElements[element.category].push(element);
  });

  return (
    <div className={cn('flex h-full w-full flex-col', className)}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Shapes size={14} className="text-[var(--color-df-video)]" />
          <span className="text-sm font-semibold">Elements</span>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Drag to canvas to add
        </div>
      </div>

      {/* Element list */}
      <div className="flex-1 overflow-y-auto py-1">
        {Object.entries(groupedElements).map(([category, elements]) =>
          renderCategory(category, elements)
        )}
      </div>
    </div>
  );
}