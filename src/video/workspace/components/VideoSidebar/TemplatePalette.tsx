'use client';

import React from 'react';
import { Layout, Image, Type, Film } from 'lucide-react';
import { useVideoWorkspaceStore } from '../../store/video-workspace-store';
import { AVAILABLE_TEMPLATES } from '@/video/templates/default-templates';
import { cn } from '@/shared/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';

interface TemplatePaletteProps {
  className?: string;
}

const TEMPLATE_INFO = {
  blank: {
    name: 'Blank Canvas',
    description: 'Start from scratch',
    icon: Layout,
  },
};

export function TemplatePalette({ className }: TemplatePaletteProps) {
  const draftGraph = useVideoWorkspaceStore((s) => s.draftGraph);
  const resetDraft = useVideoWorkspaceStore((s) => s.actions.resetDraft);

  const handleTemplateClick = (templateKey: keyof typeof AVAILABLE_TEMPLATES) => {
    const template = AVAILABLE_TEMPLATES[templateKey];
    
    console.log('Loading template:', template.name);
    
    // Load template into draft (this becomes the working copy)
    resetDraft(template);
  };

  return (
    <div className={cn('flex h-full w-full flex-col', className)}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Layout size={14} className="text-[var(--color-df-video)]" />
          <span className="text-sm font-semibold">Templates</span>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Click to load template
        </div>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto py-2">
        {Object.entries(TEMPLATE_INFO).map(([key, info]) => {
          const Icon = info.icon;
          const template = AVAILABLE_TEMPLATES[key as keyof typeof AVAILABLE_TEMPLATES];
          const isActive = draftGraph?.id === template.id;
          
          return (
            <TooltipProvider key={key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => handleTemplateClick(key as keyof typeof AVAILABLE_TEMPLATES)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-xs cursor-pointer',
                      'text-muted-foreground hover:bg-muted hover:text-foreground',
                      'transition-colors',
                      isActive && 'bg-[var(--color-df-video)]/10 text-[var(--color-df-video)] border-l-2 border-l-[var(--color-df-video)]'
                    )}
                  >
                    <Icon 
                      size={14} 
                      className={cn(
                        'shrink-0',
                        isActive ? 'text-[var(--color-df-video)]' : 'text-muted-foreground'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{info.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {info.description}
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{info.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}