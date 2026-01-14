'use client';

import React, { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';
import { Layers, Boxes, BookOpen } from 'lucide-react';
import { StoryletList } from './StoryletList';
import { NarrativeList } from './NarrativeList';
import { NodePalette } from './NodePalette';
import { useForgeWorkspaceStore } from '../store/forge-workspace-store';
import { cn } from '@/src/lib/utils';

interface ForgeSidebarProps {
  className?: string;
}

export function ForgeSidebar({ className }: ForgeSidebarProps) {
  const [activeTab, setActiveTab] = useState<'narratives' | 'storylets' | 'nodes'>('narratives');
  const focusedEditor = useForgeWorkspaceStore((s) => s.focusedEditor);

  return (
    <div className={`h-full w-full flex flex-col ${className ?? ''}`}>
      <ToggleGroup
        type="single"
        value={activeTab}
        onValueChange={(value) => {
          if (value) setActiveTab(value as 'narratives' | 'storylets' | 'nodes');
        }}
        variant="outline"
        className="w-full flex rounded-none bg-transparent h-8 px-0 gap-0 m-0 min-w-0 overflow-hidden border-b border-df-sidebar-border"
      >
        <ToggleGroupItem
          value="narratives"
          aria-label="Narratives"
          className={cn(
            "min-w-0 flex-1 text-xs rounded-none px-1 py-0.5 truncate leading-tight",
            "text-df-text-secondary hover:text-df-text-primary",
            "data-[state=on]:bg-df-control-active data-[state=on]:text-df-text-primary"
          )}
        >
          <BookOpen
            size={12}
            className={cn(
              "mr-0.5 shrink-0 transition-colors",
              activeTab === 'narratives'
                ? "text-[var(--color-df-info)]"
                : "text-[var(--color-df-info-muted,theme(colors.blue.300))]"
            )}
          />
          <span className="truncate">Narratives</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="storylets"
          aria-label="Storylets"
          className={cn(
            "min-w-0 flex-1 text-xs rounded-none px-1 py-0.5 truncate leading-tight",
            "text-df-text-secondary hover:text-df-text-primary",
            "data-[state=on]:bg-df-control-active data-[state=on]:text-df-text-primary"
          )}
        >
          <Layers
            size={12}
            className={cn(
              "mr-0.5 shrink-0 transition-colors",
              activeTab === 'storylets'
                ? "text-[var(--color-df-edge-choice-1)]"
                : "text-[var(--color-df-edge-choice-1-muted,theme(colors.green.400))]"
            )}
          />
          <span className="truncate">Storylets</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="nodes"
          aria-label="Nodes"
          className={cn(
            "min-w-0 flex-1 text-xs rounded-none px-1 py-0.5 truncate leading-tight",
            "text-df-text-secondary hover:text-df-text-primary",
            "data-[state=on]:bg-df-control-active data-[state=on]:text-df-text-primary"
          )}
        >
          <Boxes
            size={12}
            className={cn(
              "mr-0.5 shrink-0 transition-colors",
              activeTab === 'nodes'
                ? "text-[var(--color-df-warning)]"
                : "text-[var(--color-df-warning-muted,theme(colors.amber.400))]"
            )}
          />
          <span className="truncate">Nodes</span>
          {focusedEditor && (
            <span className={cn(
              "ml-0.5 text-[9px] px-1 py-0.5 rounded shrink-0",
              focusedEditor === 'narrative' && "bg-[var(--color-df-info)]/20 text-[var(--color-df-info)]",
              focusedEditor === 'storylet' && "bg-[var(--color-df-edge-choice-1)]/20 text-[var(--color-df-edge-choice-1)]"
            )}>
              {focusedEditor === 'narrative' ? 'N' : 'S'}
            </span>
          )}
        </ToggleGroupItem>
      </ToggleGroup>
      {activeTab === 'narratives' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <NarrativeList className="h-full" />
        </div>
      )}
      {activeTab === 'storylets' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <StoryletList className="h-full" />
        </div>
      )}
      {activeTab === 'nodes' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <NodePalette className="h-full" />
        </div>
      )}
    </div>
  );
}
