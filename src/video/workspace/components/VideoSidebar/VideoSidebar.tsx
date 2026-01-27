'use client';

import React, { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { Layout, Video, Shapes } from 'lucide-react';
import { useVideoWorkspaceStore } from '../../store/video-workspace-store';
import { cn } from '@/shared/lib/utils';
import { TemplatePalette } from './TemplatePalette';
import { VideoPalette } from './VideoPalette';
import { ElementPalette } from './ElementPalette';

interface VideoSidebarProps {
  className?: string;
}

export function VideoSidebar({ className }: VideoSidebarProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'videos' | 'elements'>('templates');

  return (
    <div className={`h-full w-full flex flex-col ${className ?? ''}`}>
      <ToggleGroup
        type="single"
        value={activeTab}
        onValueChange={(value) => {
          if (value) setActiveTab(value as 'templates' | 'videos' | 'elements');
        }}
        variant="outline"
        className="w-full flex rounded-none bg-transparent h-8 px-0 gap-0 m-0 min-w-0 overflow-hidden border-b border-border relative group"
      >
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-[var(--editor-border-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        
        <ToggleGroupItem
          value="templates"
          aria-label="Templates"
          className={cn(
            'min-w-0 flex-1 text-xs rounded-none px-1 py-0.5 truncate leading-tight relative',
            'text-muted-foreground hover:text-foreground transition-colors',
            'data-[state=on]:bg-muted data-[state=on]:text-foreground',
            activeTab === 'templates' && 'border-l-2 border-l-[var(--color-df-video)]',
            activeTab !== 'templates' && 'border-l-2 border-l-[var(--color-df-video)]/30'
          )}
        >
          <Layout
            size={12}
            className={cn(
              'mr-0.5 shrink-0 transition-colors',
              activeTab === 'templates'
                ? 'text-[var(--color-df-video)]'
                : 'text-[var(--color-df-video)]/50'
            )}
          />
          <span className="truncate">Templates</span>
        </ToggleGroupItem>
        
        <ToggleGroupItem
          value="videos"
          aria-label="Videos"
          className={cn(
            'min-w-0 flex-1 text-xs rounded-none px-1 py-0.5 truncate leading-tight relative',
            'text-muted-foreground hover:text-foreground transition-colors',
            'data-[state=on]:bg-muted data-[state=on]:text-foreground',
            activeTab === 'videos' && 'border-l-2 border-l-[var(--color-df-video)]',
            activeTab !== 'videos' && 'border-l-2 border-l-[var(--color-df-video)]/30'
          )}
        >
          <Video
            size={12}
            className={cn(
              'mr-0.5 shrink-0 transition-colors',
              activeTab === 'videos'
                ? 'text-[var(--color-df-video)]'
                : 'text-[var(--color-df-video)]/50'
            )}
          />
          <span className="truncate">Videos</span>
        </ToggleGroupItem>
        
        <ToggleGroupItem
          value="elements"
          aria-label="Elements"
          className={cn(
            'min-w-0 flex-1 text-xs rounded-none px-1 py-0.5 truncate leading-tight relative',
            'text-muted-foreground hover:text-foreground transition-colors',
            'data-[state=on]:bg-muted data-[state=on]:text-foreground',
            activeTab === 'elements' && 'border-l-2 border-l-[var(--color-df-video)]',
            activeTab !== 'elements' && 'border-l-2 border-l-[var(--color-df-video)]/30'
          )}
        >
          <Shapes
            size={12}
            className={cn(
              'mr-0.5 shrink-0 transition-colors',
              activeTab === 'elements'
                ? 'text-[var(--color-df-video)]'
                : 'text-[var(--color-df-video)]/50'
            )}
          />
          <span className="truncate">Elements</span>
        </ToggleGroupItem>
      </ToggleGroup>
      
      {/* Tab Content */}
      {activeTab === 'templates' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <TemplatePalette className="h-full" />
        </div>
      )}
      {activeTab === 'videos' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <VideoPalette className="h-full" />
        </div>
      )}
      {activeTab === 'elements' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <ElementPalette className="h-full" />
        </div>
      )}
    </div>
  );
}