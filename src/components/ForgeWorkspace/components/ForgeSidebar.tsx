'use client';

import React, { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';
import { Layers, Boxes } from 'lucide-react';
import { StoryletList } from './StoryletList';
import { NodePalette } from './NodePalette';
import { useForgeWorkspaceStore } from '../store/forge-workspace-store';
import { cn } from '@/src/lib/utils';

interface ForgeSidebarProps {
  className?: string;
}

export function ForgeSidebar({ className }: ForgeSidebarProps) {
  const [activeTab, setActiveTab] = useState<'storylets' | 'nodes'>('storylets');
  const focusedEditor = useForgeWorkspaceStore((s) => s.focusedEditor);

  return (
    <div className={`h-full w-full flex flex-col ${className ?? ''}`}>
      <ToggleGroup
        type="single"
        value={activeTab}
        onValueChange={(value) => {
          if (value) setActiveTab(value as 'storylets' | 'nodes');
        }}
        variant="outline"
        className="w-full rounded-none border-b border-df-sidebar-border bg-transparent h-9 px-1 gap-0"
      >
        <ToggleGroupItem
          value="storylets"
          aria-label="Storylets"
          className={cn(
            "flex-1 text-sm rounded-none border-r-0 first:rounded-l-md",
            "data-[state=on]:bg-df-control-active data-[state=on]:text-df-text-primary data-[state=on]:border-b-1 data-[state=on]:border-[var(--color-df-border-active)]",
            focusedEditor === 'storylet' && "border-l-1 border-l-[var(--color-df-edge-choice-1)]"
          )}
        >
          <Layers size={14} className="mr-1.5" />
          Storylets
        </ToggleGroupItem>
        <ToggleGroupItem
          value="nodes"
          aria-label="Nodes"
          className={cn(
            "flex-1 text-sm rounded-none border-r-0 last:rounded-r-md last:border-r",
            "data-[state=on]:bg-df-control-active data-[state=on]:text-df-text-primary data-[state=on]:border-b-1 data-[state=on]:border-[var(--color-df-border-active)]",
            focusedEditor === 'narrative' && "border-l-1 border-l-[var(--color-df-info)]",
            focusedEditor === 'storylet' && "border-l-1 border-l-[var(--color-df-edge-choice-1)]"
          )}
        >
          <Boxes size={14} className="mr-1.5" />
          Nodes
          {focusedEditor && (
            <span className={cn(
              "ml-1.5 text-[10px] px-1 py-0.5 rounded",
              focusedEditor === 'narrative' && "bg-[var(--color-df-info)]/20 text-[var(--color-df-info)]",
              focusedEditor === 'storylet' && "bg-[var(--color-df-edge-choice-1)]/20 text-[var(--color-df-edge-choice-1)]"
            )}>
              {focusedEditor === 'narrative' ? 'N' : 'S'}
            </span>
          )}
        </ToggleGroupItem>
      </ToggleGroup>
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
