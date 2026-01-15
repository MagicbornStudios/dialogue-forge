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
            backgroundColor: '#0d0d14',
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          nodeColor={node => {
            if (node.type === FORGE_NODE_TYPE.CHARACTER || node.type === FORGE_NODE_TYPE.STORYLET)
              return '#e94560';
            if (node.type === FORGE_NODE_TYPE.PLAYER) return '#8b5cf6';
            if (node.type === FORGE_NODE_TYPE.CONDITIONAL) return '#3b82f6';
            return '#4a4a6a';
          }}
          nodeStrokeWidth={2}
          pannable
          zoomable
        />
      </div>
    </Panel>
  );
}
