'use client';

import React, { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { Layers, Boxes, BookOpen } from 'lucide-react';
import { StoryletList } from './StoryletList';
import { ForgeNarrativeList } from './ForgeNarrativeList';
import { NodePalette } from './NodePalette';
import { useForgeWorkspaceStore } from '../../store/forge-workspace-store';
import { cn } from '@/shared/lib/utils';

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
        className="w-full flex rounded-none bg-transparent h-8 px-0 gap-0 m-0 min-w-0 overflow-hidden border-b border-border relative group"
      >
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-[var(--editor-border-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        <ToggleGroupItem
          value="narratives"
          aria-label="Narratives"
          className={cn(
            "min-w-0 flex-1 text-xs rounded-none px-1 py-0.5 truncate leading-tight relative",
            "text-muted-foreground hover:text-foreground transition-colors",
            "data-[state=on]:bg-muted data-[state=on]:text-foreground",
            // Left border for selected
            activeTab === 'narratives' && "border-l-2 border-l-[var(--editor-info)]",
            // Duller left border for unselected
            activeTab !== 'narratives' && "border-l-2 border-l-[var(--color-df-info-muted,theme(colors.blue.300))]/30"
          )}
        >
          <BookOpen
            size={12}
            className={cn(
              "mr-0.5 shrink-0 transition-colors",
              activeTab === 'narratives'
                ? "text-[var(--editor-info)]"
                : "text-[var(--color-df-info-muted,theme(colors.blue.300))]"
            )}
          />
          <span className="truncate">Narratives</span>
          {focusedEditor === 'narrative' && activeTab === 'narratives' && (
            <span className={cn(
              "ml-0.5 text-[9px] px-1 py-0.5 rounded shrink-0",
              "bg-[var(--editor-info)]/20 text-[var(--editor-info)]"
            )}>
              N
            </span>
          )}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="storylets"
          aria-label="Storylets"
          className={cn(
            "min-w-0 flex-1 text-xs rounded-none px-1 py-0.5 truncate leading-tight relative",
            "text-muted-foreground hover:text-foreground transition-colors",
            "data-[state=on]:bg-muted data-[state=on]:text-foreground",
            // Left border for selected
            activeTab === 'storylets' && "border-l-2 border-l-[var(--editor-edge-choice)]",
            // Duller left border for unselected
            activeTab !== 'storylets' && "border-l-2 border-l-[var(--color-df-edge-choice-1-muted,theme(colors.green.400))]/30"
          )}
        >
          <Layers
            size={12}
            className={cn(
              "mr-0.5 shrink-0 transition-colors",
              activeTab === 'storylets'
                ? "text-[var(--editor-edge-choice)]"
                : "text-[var(--color-df-edge-choice-1-muted,theme(colors.green.400))]"
            )}
          />
          <span className="truncate">Storylets</span>
          {focusedEditor === 'storylet' && activeTab === 'storylets' && (
            <span className={cn(
              "ml-0.5 text-[9px] px-1 py-0.5 rounded shrink-0",
              "bg-[var(--editor-edge-choice)]/20 text-[var(--editor-edge-choice)]"
            )}>
              S
            </span>
          )}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="nodes"
          aria-label="Nodes"
          className={cn(
            "min-w-0 flex-1 text-xs rounded-none px-1 py-0.5 truncate leading-tight relative",
            "text-muted-foreground hover:text-foreground transition-colors",
            "data-[state=on]:bg-muted data-[state=on]:text-foreground",
            // Left border for selected
            activeTab === 'nodes' && "border-l-2 border-l-[var(--editor-warning)]",
            // Duller left border for unselected
            activeTab !== 'nodes' && "border-l-2 border-l-[var(--color-df-warning-muted,theme(colors.amber.400))]/30"
          )}
        >
          <Boxes
            size={12}
            className={cn(
              "mr-0.5 shrink-0 transition-colors",
              activeTab === 'nodes'
                ? "text-[var(--editor-warning)]"
                : "text-[var(--color-df-warning-muted,theme(colors.amber.400))]"
            )}
          />
          <span className="truncate">Nodes</span>
          {focusedEditor && activeTab === 'nodes' && (
            <span className={cn(
              "ml-0.5 text-[9px] px-1 py-0.5 rounded shrink-0",
              focusedEditor === 'narrative' && "bg-[var(--editor-info)]/20 text-[var(--editor-info)]",
              focusedEditor === 'storylet' && "bg-[var(--editor-edge-choice)]/20 text-[var(--editor-edge-choice)]"
            )}>
              {focusedEditor === 'narrative' ? 'N' : 'S'}
            </span>
          )}
        </ToggleGroupItem>
      </ToggleGroup>
      {activeTab === 'narratives' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <ForgeNarrativeList className="h-full" />
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
