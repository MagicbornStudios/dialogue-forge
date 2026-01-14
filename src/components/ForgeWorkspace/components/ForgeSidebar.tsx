'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { StoryletsSidebar } from './StoryletsSidebar';
import { NodePalette } from './NodePalette';

interface ForgeSidebarProps {
  className?: string;
}

export function ForgeSidebar({ className }: ForgeSidebarProps) {
  return (
    <div className={`h-full w-full flex flex-col ${className ?? ''}`}>
      <Tabs defaultValue="storylets" className="h-full w-full flex flex-col">
        <TabsList className="w-full rounded-none border-b border-df-sidebar-border bg-transparent h-8 px-1">
          <TabsTrigger
            value="storylets"
            className="flex-1 text-xs data-[state=active]:bg-df-control-active data-[state=active]:text-df-text-primary data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-df-border-active)]"
          >
            Storylets
          </TabsTrigger>
          <TabsTrigger
            value="nodes"
            className="flex-1 text-xs data-[state=active]:bg-df-control-active data-[state=active]:text-df-text-primary data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-df-border-active)]"
          >
            Nodes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="storylets" className="flex-1 m-0 mt-0 overflow-hidden">
          <StoryletsSidebar className="h-full" />
        </TabsContent>
        <TabsContent value="nodes" className="flex-1 m-0 mt-0 overflow-hidden">
          <NodePalette className="h-full" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
