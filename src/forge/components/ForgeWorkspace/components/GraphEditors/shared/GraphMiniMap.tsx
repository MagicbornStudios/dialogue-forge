import React from 'react';
import { Panel, MiniMap } from 'reactflow';
import { FORGE_NODE_TYPE } from '@/forge/types/forge-graph';

interface GraphMiniMapProps {
  showMiniMap: boolean;
}

export function GraphMiniMap({ showMiniMap }: GraphMiniMapProps) {
  if (!showMiniMap) return null;

  return (
    <Panel position="bottom-right" className="!p-0 !m-2">
      <div className="bg-df-sidebar-bg border border-df-sidebar-border rounded-lg overflow-hidden shadow-xl">
        <div className="px-3 py-1.5 border-b border-df-sidebar-border flex items-center justify-between bg-df-elevated">
          <span className="text-[10px] font-medium text-df-text-secondary uppercase tracking-wider">
            Overview
          </span>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-df-npc-selected" title="NPC / Storylet" />
            <span className="w-2 h-2 rounded-full bg-df-player-selected" title="Player" />
            <span className="w-2 h-2 rounded-full bg-df-conditional-border" title="Conditional" />
          </div>
        </div>
        <MiniMap
          style={{
            width: 180,
            height: 120,
            backgroundColor: 'var(--minimap-bg)',
          }}
          maskColor="var(--minimap-mask)"
          nodeColor={node => {
            if (node.type === FORGE_NODE_TYPE.CHARACTER || node.type === FORGE_NODE_TYPE.STORYLET)
              return 'var(--minimap-node-character)';
            if (node.type === FORGE_NODE_TYPE.PLAYER) return 'var(--minimap-node-player)';
            if (node.type === FORGE_NODE_TYPE.CONDITIONAL) return 'var(--minimap-node-conditional)';
            return 'var(--minimap-node-default)';
          }}
          nodeStrokeWidth={2}
          pannable
          zoomable
        />
      </div>
    </Panel>
  );
}
