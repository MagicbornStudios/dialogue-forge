'use client';

import React, { useCallback, useState } from 'react';
import { Copy, RefreshCw, X } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Button } from '@/shared/ui/button';
import JsonView from '@uiw/react-json-view';
import type { RelationshipFlow } from '@/characters/types';
import type { RelationshipGraphEditorRef } from './RelationshipGraphEditor';
import { cn } from '@/shared/lib/utils';

type TabId = 'joint' | 'flow';

interface GraphDebugDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  graphEditorRef: React.RefObject<RelationshipGraphEditorRef | null>;
  relationshipFlow: RelationshipFlow | null;
}

export function GraphDebugDrawer({
  open,
  onOpenChange,
  graphEditorRef,
  relationshipFlow,
}: GraphDebugDrawerProps) {
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
        // Ref may not be ready yet; try again so JointJS (toJSON) tab populates
        setTimeout(refresh, 200);
      }
      onOpenChange(next);
    },
    [onOpenChange, refresh]
  );

  const handleCopy = useCallback(() => {
    const data =
      activeTab === 'joint'
        ? jointJson
        : relationshipFlow;
    if (data == null) return;
    const text = JSON.stringify(data, null, 2);
    void navigator.clipboard.writeText(text);
  }, [activeTab, jointJson, relationshipFlow]);

  const flowData = relationshipFlow ?? { nodes: [], edges: [] };

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
              RelationshipFlow (saved)
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
