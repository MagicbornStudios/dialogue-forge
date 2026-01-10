import React from 'react';
import { CircleDot } from 'lucide-react';
import { NarrativeGraphEditor } from '../../NarrativeGraphEditor/NarrativeGraphEditor';
import { YarnView } from '../../EditorComponents/YarnView';
import { GraphToolbar } from '../../EditorComponents/GraphToolbar';
import type { StoryThread } from '../../../types/narrative';
import type { DialogueTree, ViewMode } from '../../../types';
import { VIEW_MODE } from '../../../types/constants';
import { exportDialogueToYarn } from '../utils/narrative-workspace-utils';

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
      <GraphToolbar
        title="Narrative Graph"
        titleIcon={<CircleDot size={12} />}
        titleTooltip="Shows act/chapter/page hierarchy."
        viewMode={narrativeViewMode}
        onViewModeChange={onViewModeChange}
        onExport={() => exportDialogueToYarn(dialogueTree)}
        exportLabel="Export"
      />
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
