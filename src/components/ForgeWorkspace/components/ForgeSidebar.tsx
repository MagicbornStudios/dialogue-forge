'use client';

import React, { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';
import { Layers, Boxes } from 'lucide-react';
import { StoryletsSidebar } from './StoryletsSidebar';
import { NodePalette } from './NodePalette';

interface ForgeSidebarProps {
  className?: string;
}

export function ForgeSidebar({ className }: ForgeSidebarProps) {
  const [activeTab, setActiveTab] = useState<'storylets' | 'nodes'>('storylets');

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
          className="flex-1 text-sm rounded-none border-r-0 first:rounded-l-md data-[state=on]:bg-df-control-active data-[state=on]:text-df-text-primary data-[state=on]:border-b-2 data-[state=on]:border-[var(--color-df-border-active)]"
        >
          <Layers size={14} className="mr-1.5" />
          Storylets
        </ToggleGroupItem>
        <ToggleGroupItem
          value="nodes"
          aria-label="Nodes"
          className="flex-1 text-sm rounded-none border-r-0 last:rounded-r-md last:border-r data-[state=on]:bg-df-control-active data-[state=on]:text-df-text-primary data-[state=on]:border-b-2 data-[state=on]:border-[var(--color-df-border-active)]"
        >
          <Boxes size={14} className="mr-1.5" />
          Nodes
        </ToggleGroupItem>
      </ToggleGroup>
      {activeTab === 'storylets' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <StoryletsSidebar className="h-full" />
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
