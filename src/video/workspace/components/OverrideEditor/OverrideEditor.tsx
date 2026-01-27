'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useVideoWorkspaceStore } from '../../store/video-workspace-store';
import { DefaultTab } from './DefaultTab';
import { OverrideTab } from './OverrideTab';

export function OverrideEditor() {
  const overrideTab = useVideoWorkspaceStore((s) => s.overrideTab ?? 'default');
  const setOverrideTab = useVideoWorkspaceStore((s) => s.actions.setOverrideTab);

  return (
    <Tabs value={overrideTab} onValueChange={(v) => setOverrideTab(v as 'default' | 'override')} className="flex flex-col h-full">
      <div className="border-b border-border px-4 py-2">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="default">Template (Editable)</TabsTrigger>
          <TabsTrigger value="override">Override Preview</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="default" className="flex-1 min-h-0 mt-0">
        <DefaultTab />
      </TabsContent>

      <TabsContent value="override" className="flex-1 min-h-0 mt-0">
        <OverrideTab />
      </TabsContent>
    </Tabs>
  );
}
