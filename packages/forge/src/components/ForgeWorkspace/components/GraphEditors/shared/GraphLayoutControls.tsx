import React from 'react';
import { Panel } from 'reactflow';
import { Layout, ArrowDown, ArrowRight, Magnet, Sparkles, Undo2, Flag, Home } from 'lucide-react';
import { LayoutDirection } from '@magicborn/forge/lib/utils/layout/types';

interface GraphLayoutControlsProps {
  autoOrganize: boolean;
  onToggleAutoOrganize: () => void;
  layoutDirection: LayoutDirection;
  onLayoutDirectionChange: (direction: LayoutDirection) => void;
  onApplyLayout: () => void;
  showPathHighlight: boolean;
  onTogglePathHighlight: () => void;
  showBackEdges: boolean;
  onToggleBackEdges: () => void;
  onGoToStart?: () => void;
  onGoToEnd?: () => void;
  endNodeCount?: number;
}

export function GraphLayoutControls({
  autoOrganize,
  onToggleAutoOrganize,
  layoutDirection,
  onLayoutDirectionChange,
  onApplyLayout,
  showPathHighlight,
  onTogglePathHighlight,
  showBackEdges,
  onToggleBackEdges,
  onGoToStart,
  onGoToEnd,
  endNodeCount,
}: GraphLayoutControlsProps) {
  return (
    <Panel position="top-right" className="!bg-transparent !border-0 !p-0 !m-2">
      <div className="group flex items-center gap-1.5 bg-df-sidebar-bg border border-df-sidebar-border rounded-lg p-1.5 shadow-lg">
        {/* Auto-organize toggle */}
        <button
          onClick={onToggleAutoOrganize}
          className={`p-1.5 rounded transition-colors ${
            autoOrganize
              ? 'bg-df-success/20 text-df-success border border-df-success'
              : 'bg-df-elevated text-df-text-secondary hover:text-df-text-primary border border-df-control-border'
          }`}
          title={autoOrganize ? 'Auto Layout ON - Nodes auto-arrange' : 'Auto Layout OFF - Free placement'}
        >
          <Magnet size={14} />
        </button>

        <div className="w-px h-5 bg-df-control-border" />

        {/* Layout direction buttons */}
        <div className="flex border border-df-control-border rounded overflow-hidden">
          <button
            onClick={() => onLayoutDirectionChange('TB')}
            className={`p-1.5 transition-colors ${
              layoutDirection === 'TB'
                ? 'bg-df-npc-selected/20 text-df-npc-selected'
                : 'bg-df-elevated text-df-text-secondary hover:text-df-text-primary'
            } border-r border-df-control-border`}
            title="Vertical Layout (Top to Bottom)"
          >
            <ArrowDown size={14} />
          </button>
          <button
            onClick={() => onLayoutDirectionChange('LR')}
            className={`p-1.5 transition-colors ${
              layoutDirection === 'LR'
                ? 'bg-df-player-selected/20 text-df-player-selected'
                : 'bg-df-elevated text-df-text-secondary hover:text-df-text-primary'
            }`}
            title="Horizontal Layout (Left to Right)"
          >
            <ArrowRight size={14} />
          </button>
        </div>

        <button
          onClick={onApplyLayout}
          className="p-1.5 bg-df-elevated border border-df-control-border rounded text-df-text-secondary hover:text-df-text-primary hover:border-df-control-hover transition-colors"
          title="Re-apply Layout"
        >
          <Layout size={14} />
        </button>

        <div className="w-px h-5 bg-df-control-border" />

        {/* Path highlighting toggle */}
        <button
          onClick={onTogglePathHighlight}
          className={`p-1.5 rounded transition-colors ${
            showPathHighlight
              ? 'bg-df-info/20 text-df-info border border-df-info'
              : 'bg-df-elevated text-df-text-secondary hover:text-df-text-primary border border-df-control-border'
          }`}
          title={showPathHighlight ? 'Path Highlight ON' : 'Path Highlight OFF'}
        >
          <Sparkles size={14} />
        </button>

        {/* Back-edge visualization toggle */}
        <button
          onClick={onToggleBackEdges}
          className={`p-1.5 rounded transition-colors ${
            showBackEdges
              ? 'bg-df-warning/20 text-df-warning border border-df-warning'
              : 'bg-df-elevated text-df-text-secondary hover:text-df-text-primary border border-df-control-border'
          }`}
          title={showBackEdges ? 'Loop Edges Styled' : 'Loop Edges Normal'}
        >
          <Undo2 size={14} />
        </button>

        {(onGoToStart || onGoToEnd) && <div className="w-px h-5 bg-df-control-border" />}

        {/* Quick select start node */}
        {onGoToStart && (
          <button
            onClick={onGoToStart}
            className="p-1.5 bg-df-start/20 text-df-start border border-df-start rounded transition-colors hover:bg-df-start/30"
            title="Go to Start Node"
          >
            <Home size={14} />
          </button>
        )}

        {/* Quick select an end node */}
        {onGoToEnd && (
          <button
            onClick={onGoToEnd}
            className="p-1.5 bg-df-end/20 text-df-end border border-df-end rounded transition-colors hover:bg-df-end/30"
            title={`Go to End Node${endNodeCount !== undefined ? ` (${endNodeCount} total)` : ''}`}
          >
            <Flag size={14} />
          </button>
        )}
      </div>
    </Panel>
  );
}

