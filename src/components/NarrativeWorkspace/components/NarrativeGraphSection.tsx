import React from 'react';
import { CircleDot, Download, Info } from 'lucide-react';
import { NarrativeGraphEditor } from '../../NarrativeGraphEditor';
import { YarnView } from '../../EditorComponents/YarnView';
import type { StoryThread } from '../../../types/narrative';
import type { DialogueTree, ViewMode } from '../../../types';
import { VIEW_MODE } from '../../../types/constants';
import { exportDialogueToYarn } from '../utils/narrative-workspace-utils';
import { GraphViewModeTabs } from '@/src/components/forge/GraphViewModeTabs';
import { Button } from '@/src/components/ui/button';

interface NarrativeGraphSectionProps {
  thread: StoryThread;
  dialogueTree: DialogueTree;
  narrativeViewMode: ViewMode;
  showNarrativeMiniMap: boolean;
  onViewModeChange: (mode: ViewMode) => void;
  onToggleMiniMap: () => void;
  onPaneContextMenu: (event: React.MouseEvent) => void;
  onPaneClick: () => void;
  onSelectElement: (elementType: any, elementId: string) => void;
}

export function NarrativeGraphSection({
  thread,
  dialogueTree,
  narrativeViewMode,
  showNarrativeMiniMap,
  onViewModeChange,
  onToggleMiniMap,
  onPaneContextMenu,
  onPaneClick,
  onSelectElement,
}: NarrativeGraphSectionProps) {


  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-df-node-border bg-df-editor-bg px-2 py-1.5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
          <CircleDot size={12} />
          Narrative Graph
          <span title="Shows act/chapter/page hierarchy.">
            <Info size={12} />
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GraphViewModeTabs value={narrativeViewMode} onChange={onViewModeChange} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => exportDialogueToYarn(dialogueTree)}
            title="Export yarn"
            className="h-10"
          >
            <Download size={12} />
            Export
          </Button>
        </div>
      </div>
      <div className="h-[220px] min-h-[200px] rounded-lg border border-df-node-border bg-df-editor-bg p-1">
        {narrativeViewMode === VIEW_MODE.GRAPH ? (
          <NarrativeGraphEditor
            thread={thread}
            className="h-full"
            showMiniMap={showNarrativeMiniMap}
            onToggleMiniMap={onToggleMiniMap}
            onPaneContextMenu={onPaneContextMenu}
            onPaneClick={onPaneClick}
            onSelectElement={onSelectElement}
          />
        ) : (
          <YarnView dialogue={dialogueTree} onExport={() => exportDialogueToYarn(dialogueTree)} />
        )}
      </div>
    </>
  );
}
