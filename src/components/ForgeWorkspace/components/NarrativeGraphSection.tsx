// src/components/ForgeWorkspace/components/NarrativeGraphSection.tsx
import React from 'react';
import { CircleDot } from 'lucide-react';

import { ForgeNarrativeGraphEditor } from '../../GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor';
import { GraphToolbar } from '../../GraphEditors/shared/GraphToolbar';
import { YarnView } from '../../GraphEditors/shared/YarnView';

import type { ForgeGraphDoc } from '../../../types';
import { VIEW_MODE, type ViewMode } from '../../../types/constants';
import { exportDialogueToYarn } from '../utils/forge-workspace-utils';

interface NarrativeGraphSectionProps {
  graph: ForgeGraphDoc | null;
  onGraphChange: (graph: ForgeGraphDoc) => void;
}

export function NarrativeGraphSection({ graph, onGraphChange }: NarrativeGraphSectionProps) {
  // View mode is section-local (not workspace-global).
  const [viewMode, setViewMode] = React.useState<ViewMode>(VIEW_MODE.GRAPH);

  return (
    <>
      <GraphToolbar
        title="Narrative Graph"
        titleIcon={<CircleDot size={12} />}
        titleTooltip="Narrative flow graph."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onExport={graph ? () => exportDialogueToYarn(graph) : undefined}
        exportLabel="Export"
      />

      <div className="h-[220px] min-h-[200px] rounded-lg border border-df-node-border bg-df-editor-bg p-1">
        {!graph ? (
          <div className="flex h-full w-full items-center justify-center text-sm text-df-text-secondary">
            No narrative graph loaded.
          </div>
        ) : viewMode === VIEW_MODE.GRAPH ? (
          <ForgeNarrativeGraphEditor graph={graph} onChange={onGraphChange} className="h-full" />
        ) : (
          <YarnView dialogue={graph} onExport={() => exportDialogueToYarn(graph)} />
        )}
      </div>
    </>
  );
}
