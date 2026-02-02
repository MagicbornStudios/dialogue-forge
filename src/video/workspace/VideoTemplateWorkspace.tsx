'use client';

import React, { useMemo, useState } from 'react';
import { useStore } from 'zustand';
import type { VideoTemplate } from '@/video/templates/types/video-template';
import { createVideoDraftStore } from '@/video/workspace/store/video-draft-slice';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

export interface VideoTemplateWorkspaceProps {
  className?: string;
  template?: VideoTemplate | null;
  adapter?: any;
  onTemplateChange?: (template: VideoTemplate | null) => void;
  onSaveTemplate?: () => void;
}

export function VideoTemplateWorkspace({
  className,
  template,
  adapter,
  onTemplateChange,
  onSaveTemplate,
}: VideoTemplateWorkspaceProps) {
  const draftStoreRef = React.useRef<ReturnType<typeof createVideoDraftStore> | null>(null);
  if (!draftStoreRef.current) {
    draftStoreRef.current = createVideoDraftStore(template ?? null);
  }
  const draftStore = draftStoreRef.current;

  const draftTemplate = useStore(draftStore, (state) => state.draftGraph);
  const hasUncommittedChanges = useStore(draftStore, (state) => state.hasUncommittedChanges);
  const [selectedLayerId, setSelectedLayerId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('templates');

  const workspaceTokens = {
    '--video-workspace-bg': 'var(--color-df-editor-bg)',
    '--video-workspace-panel': 'var(--color-df-surface)',
    '--video-workspace-border': 'var(--color-df-editor-border)',
    '--video-workspace-muted': 'var(--color-df-control-bg)',
    '--video-workspace-preview': 'var(--color-df-canvas-bg)',
    '--video-workspace-text': 'var(--color-df-text-primary)',
    '--video-workspace-text-muted': 'var(--color-df-text-tertiary)',
  };

  // Conditional property inspector - only show when element selected
  const showProperties = selectedLayerId !== undefined;

  return (
    <div
      className={className}
      style={workspaceTokens}
      data-domain="video"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--video-workspace-border)] bg-[var(--video-workspace-panel)]">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-[var(--video-workspace-text)]">Video Template Workspace</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[11px]">
              {adapter ? 'Adapter ready' : 'Adapter unbound'}
            </Badge>
            {hasUncommittedChanges ? (
              <Badge variant="secondary" className="text-[11px]">
                Draft changes
              </Badge>
            ) : null}
          </div>
          <div className="text-sm text-[var(--video-workspace-text-muted)]">
            {template ? `Editing ${template.name}` : 'No template selected'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={onSaveTemplate} 
            disabled={!template || !adapter}
          >
            Save Template
          </Button>
        </div>
      </div>

      {/* Three Panel Layout */}
      <div className="grid flex-1 gap-4" style={{ gridTemplateColumns: '280px 1fr 320px' }}>
        {/* Left Sidebar - Tabbed Interface */}
        <div className="w-[280px] min-w-0 border-r border-[var(--video-workspace-border)] bg-[var(--video-workspace-panel)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="flex justify-between px-4 py-2 border-b border-[var(--video-workspace-border)]">
              <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
              <TabsTrigger value="videos" className="text-xs">Videos</TabsTrigger>
              <TabsTrigger value="elements" className="text-xs">Elements</TabsTrigger>
            </TabsList>
            
            <TabsContent value="templates" className="flex-1 overflow-y-auto p-4">
              <div className="text-sm font-semibold text-[var(--video-workspace-text)] mb-2">Templates</div>
              <div className="text-xs text-[var(--video-workspace-text-muted)] mb-4">
                Select a template to begin editing
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => {/* Load blank template */}}>
                  Blank Template
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => {/* Load hero template */}}>
                  Hero Banner
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => {/* Load lower third template */}}>
                  Lower Third
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="videos" className="flex-1 overflow-y-auto p-4">
              <div className="text-sm font-semibold text-[var(--video-workspace-text)] mb-2">Videos</div>
              <div className="text-xs text-[var(--video-workspace-text-muted)]">
                Video library coming soon
              </div>
            </TabsContent>
            
            <TabsContent value="elements" className="flex-1 overflow-y-auto p-4">
              <div className="text-sm font-semibold text-[var(--video-workspace-text)] mb-2">Elements</div>
              <div className="text-xs text-[var(--video-workspace-text-muted)] mb-4">
                Drag elements to canvas
              </div>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => {/* Add text element */}}>
                  Text Element
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => {/* Add rectangle element */}}>
                  Rectangle
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => {/* Add circle element */}}>
                  Circle
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => {/* Add image element */}}>
                  Image
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center Panel - Visual Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 border-b border-[var(--video-workspace-border)] min-h-0">
            <div className="text-sm font-semibold text-[var(--video-workspace-text)] p-4">
              Visual Canvas
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {/* Show blank white canvas when no template selected */}
            {template ? (
              <div className="relative w-full h-full min-h-[400px] bg-white border-2 border-gray-200 rounded"
                   style={{ aspectRatio: `${template.width}/${template.height}` }}>
                {/* Canvas content will go here */}
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                  Canvas ready for elements - drag from sidebar
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full min-h-[400px] bg-white border-2 border-gray-200 rounded"
                   style={{ aspectRatio: '16/9' }}>
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                  No template selected - choose from sidebar
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Conditional Properties Inspector */}
        {showProperties ? (
          <div className="w-80 border-l border-[var(--video-workspace-border)] overflow-y-auto bg-[var(--video-workspace-panel)]">
            <div className="p-4">
              <div className="text-sm font-semibold text-[var(--video-workspace-text)] mb-4">Properties</div>
              <div className="text-xs text-[var(--video-workspace-text-muted)] mb-4">
                Editing: {selectedLayerId}
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">Position</div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-[var(--video-workspace-text)]">X: 100</div>
                    <div className="w-20 text-[var(--video-workspace-text)]">Y: 100</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-wide text-[var(--video-workspace-text-muted)]">Size</div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-[var(--video-workspace-text)]">Width: 200</div>
                    <div className="w-20 text-[var(--video-workspace-text)]">Height: 100</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-80 border-l border-[var(--video-workspace-border)] overflow-y-auto bg-[var(--video-workspace-panel)]">
            <div className="p-4">
              <div className="text-sm font-semibold text-[var(--video-workspace-text)] mb-4">Properties</div>
              <div className="text-xs text-[var(--video-workspace-text-muted)]">
                Select an element to edit properties
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}