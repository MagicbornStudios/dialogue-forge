// src/components/ForgeWorkspace/components/StoryletGraphSection.tsx
import React from 'react';
import { LayoutPanelTop, Info } from 'lucide-react';

import { ForgeStoryletGraphEditor } from '../../GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor';
import { YarnView } from '../../GraphEditors/shared/YarnView';
import { GraphViewModeTabs } from '../../GraphEditors/shared/GraphViewModeTabs';

import type { ForgeGraphDoc } from '../../../types';
import type { FlagSchema } from '../../../types/flags';
import type { Character } from '../../../types/characters';
import { VIEW_MODE, type ViewMode } from '../../../types/constants';
import { exportDialogueToYarn } from '../utils/forge-workspace-utils';

interface StoryletGraphSectionProps {
  graph: ForgeGraphDoc | null;
  onGraphChange: (graph: ForgeGraphDoc) => void;
  flagSchema?: FlagSchema;
  characters?: Record<string, Character>;
}

export function StoryletGraphSection({
  graph,
  onGraphChange,
  flagSchema,
  characters,
}: StoryletGraphSectionProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>(VIEW_MODE.GRAPH);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-df-node-border bg-df-editor-bg px-2 py-1.5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
          <LayoutPanelTop size={12} />
          Storylet Graph
          <span title={graph?.title ? `Editing storylet: ${graph.title}` : 'No storylet graph loaded.'}>
            <Info size={12} />
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-df-text-tertiary">
          <GraphViewModeTabs value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-lg border border-df-node-border bg-df-editor-bg p-1">
        {!graph ? (
          <div className="flex h-full w-full items-center justify-center text-sm text-df-text-secondary">
            No storylet graph loaded.
          </div>
        ) : viewMode === VIEW_MODE.GRAPH ? (
          <ForgeStoryletGraphEditor
            graph={graph}
            onChange={onGraphChange}
            flagSchema={flagSchema}
            characters={characters}
            className="h-full"
          />
        ) : (
          <YarnView dialogue={graph} onExport={() => exportDialogueToYarn(graph)} />
        )}
      </div>
    </>
  );
}
