import React from 'react';
import { LayoutPanelTop, Download, Info } from 'lucide-react';
import { DialogueGraphEditor } from '../../GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor';
import { YarnView } from '../../GraphEditors/shared/YarnView';
import type { ForgeGraph, ViewMode } from '../../../types';
import type { FlagSchema } from '../../../types/flags';
import type { Character } from '../../../types/characters';
import { VIEW_MODE } from '../../../types/constants';
import { exportDialogueToYarn } from '../utils/forge-workspace-utils';
import { GraphViewModeTabs } from '../../GraphEditors/shared/GraphViewModeTabs';
import { Button } from '../../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import type { DialoguePanelTab } from '../../forge/store/forge-ui-store';

interface StoryletGraphSectionProps {
  dialogue: ForgeGraph;
  scopedDialogue: ForgeGraph;
  selectedPage: any;
  selectedStoryletEntry: any;
  activeTab: DialoguePanelTab;
  onTabChange: (tab: DialoguePanelTab) => void;
  storyletTabEnabled: boolean;
  dialogueViewMode: ViewMode;
  showDialogueMiniMap: boolean;
  flagSchema?: FlagSchema;
  characters: Record<string, Character>;
  onDialogueChange: (dialogue: ForgeGraph) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleMiniMap: () => void;
}

export function StoryletGraphSection({
  dialogue,
  scopedDialogue,
  selectedPage,
  selectedStoryletEntry,
  activeTab,
  onTabChange,
  storyletTabEnabled,
  dialogueViewMode,
  showDialogueMiniMap,
  flagSchema,
  characters,
  onDialogueChange,
  onViewModeChange,
  onToggleMiniMap,
}: StoryletGraphSectionProps) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-df-node-border bg-df-editor-bg px-2 py-1.5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
          <LayoutPanelTop size={12} />
          Dialogue Graph
          <span
            title={selectedPage?.title ? `Editing page: ${selectedPage.title}` : 'Editing page scope.'}
          >
            <Info size={12} />
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-df-text-tertiary">
          <Tabs value={activeTab} onValueChange={value => onTabChange(value as DialoguePanelTab)}>
            <TabsList>
              <TabsTrigger value="page">Page</TabsTrigger>
              <TabsTrigger value="storyletTemplate" disabled={!storyletTabEnabled}>
                Storylet
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <span className="inline-flex items-center gap-1 rounded-full border border-df-control-border bg-df-control-bg px-2 py-1">
            {activeTab === 'storyletTemplate' ? 'Storylet' : 'Page'} · {activeTab === 'storyletTemplate'
              ? (selectedStoryletEntry?.template.title ?? 'Storylet')
              : (selectedPage?.title ?? 'Page')}
          </span>
          <GraphViewModeTabs value={dialogueViewMode} onChange={onViewModeChange} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => exportDialogueToYarn(scopedDialogue)}
            title="Export yarn"
            className="h-10"
          >
            <Download size={12} />
            Export
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 rounded-lg border border-df-node-border bg-df-editor-bg p-1">
        {dialogueViewMode === VIEW_MODE.GRAPH ? (
          <DialogueGraphEditor
            graph={scopedDialogue}
            onChange={onDialogueChange}
            flagSchema={flagSchema}
            characters={characters}
            viewMode={VIEW_MODE.GRAPH}
            className="h-full"
            showMiniMap={showDialogueMiniMap}
            onToggleMiniMap={onToggleMiniMap}
          />
        ) : (
          <YarnView dialogue={scopedDialogue} onExport={() => exportDialogueToYarn(scopedDialogue)} />
        )}
      </div>
    </>
  );
}
