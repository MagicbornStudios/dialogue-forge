import React from 'react';
import { Panel } from 'reactflow';
import { Map } from 'lucide-react';

interface MiniMapToggleProps {
  showMiniMap: boolean;
  onToggle: () => void;
}

export function MiniMapToggle({ showMiniMap, onToggle }: MiniMapToggleProps) {
  return (
    <Panel position="top-left" className="!p-0 !m-2">
      <button
        type="button"
        onClick={onToggle}
        className="rounded-md border border-df-control-border bg-df-control-bg p-1 text-df-text-secondary hover:text-df-text-primary"
        title={showMiniMap ? 'Hide minimap' : 'Show minimap'}
      >
        <Map size={14} />
      </button>
    </Panel>
  );
}
