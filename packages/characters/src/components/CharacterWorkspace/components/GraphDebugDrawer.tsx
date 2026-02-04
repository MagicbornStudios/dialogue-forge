'use client';

import React, { useCallback, useState } from 'react';
import { Copy, RefreshCw, X } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@magicborn/shared/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@magicborn/shared/ui/tabs';
import { Button } from '@magicborn/shared/ui/button';
import JsonView from '@uiw/react-json-view';
import type { JointGraphJson } from '@magicborn/characters/types';
import type { RelationshipGraphEditorBlankRef } from './RelationshipGraphEditorBlank';
import { useCharacterWorkspaceStore } from '../store/character-workspace-store';
import { cn } from '@magicborn/shared/lib/utils';

type TabId = 'joint' | 'flow';

interface GraphDebugDrawerProps {
  graphEditorRef: React.RefObject<RelationshipGraphEditorBlankRef | null>;
  graphJson?: JointGraphJson | null;
}

/**
 * Debug drawer for the relationship graph. Open/close state comes from the workspace store
 * (like CharacterWorkspaceModals).
 */
export function GraphDebugDrawer({
  graphEditorRef,
  graphJson = null,
}: GraphDebugDrawerProps) {
  const open = useCharacterWorkspaceStore((s) => s.isDebugDrawerOpen);
  const closeDrawer = useCharacterWorkspaceStore((s) => s.actions.closeDebugDrawer);

  const [jointJson, setJointJson] = useState<object | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('joint');

  const refresh = useCallback(() => {
    const joint = graphEditorRef.current?.getJointGraphJson() ?? null;
    setJointJson(joint);
  }, [graphEditorRef]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        refresh();
        setTimeout(refresh, 200);
      } else {
        closeDrawer();
      }
    },
    [closeDrawer, refresh]
  );

  const handleCopy = useCallback(() => {
    const data =
      activeTab === 'joint'
        ? jointJson
        : graphJson;
    if (data == null) return;
    const text = JSON.stringify(data, null, 2);
    void navigator.clipboard.writeText(text);
  }, [activeTab, jointJson, graphJson]);

  const flowData = graphJson ?? { nodes: [], edges: [] };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} direction="right" shouldScaleBackground={false}>
      <DrawerContent
        className={cn(
          'flex flex-col gap-0 p-0 h-full w-full min-w-[min(90vw,64rem)]'
        )}
      >
        <DrawerHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
          <div className="flex items-center justify-between gap-2">
            <DrawerTitle className="text-base">Graph debug</DrawerTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={refresh}
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopy}
                title="Copy JSON"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Close">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as TabId);
            if (v === 'joint') refresh();
          }}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="shrink-0 w-full justify-start rounded-none border-b border-border bg-transparent px-4 h-9">
            <TabsTrigger value="joint" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              JointJS (toJSON)
            </TabsTrigger>
            <TabsTrigger value="flow" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              Graph JSON (saved)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="joint" className="flex-1 min-h-0 mt-0 overflow-auto p-4 data-[state=inactive]:hidden">
            {jointJson !== null ? (
              <JsonView
                value={jointJson}
                style={{ fontSize: 12 }}
                enableClipboard
                displayDataTypes
                collapsed={2}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No JointJS graph (editor not ready). Click Refresh after opening.</p>
            )}
          </TabsContent>
          <TabsContent value="flow" className="flex-1 min-h-0 mt-0 overflow-auto p-4 data-[state=inactive]:hidden">
            <JsonView
              value={flowData}
              style={{ fontSize: 12 }}
              enableClipboard
              displayDataTypes
              collapsed={2}
            />
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
}
