import React, { useState } from 'react';
import { Panel } from 'reactflow';
import { Grid3x3, Map as MapIcon, Settings, BookOpen } from 'lucide-react';
import { listLayouts } from '../../utils/layout';
import { ExampleLoaderButton } from '../ExampleLoaderButton';
import { ENABLE_DEBUG_TOOLS } from '../../utils/feature-flags';

interface GraphLeftToolbarProps {
  layoutStrategy: string;
  onLayoutStrategyChange?: (strategy: string) => void;
  onApplyLayout?: () => void;
  showMiniMap?: boolean;
  onToggleMiniMap?: () => void;
  onOpenFlagManager?: () => void;
  onOpenGuide?: () => void;
  onLoadExampleDialogue?: (dialogue: any) => void;
  onLoadExampleFlags?: (flags: any) => void;
}

export function GraphLeftToolbar({
  layoutStrategy,
  onLayoutStrategyChange,
  onApplyLayout,
  showMiniMap,
  onToggleMiniMap,
  onOpenFlagManager,
  onOpenGuide,
  onLoadExampleDialogue,
  onLoadExampleFlags,
}: GraphLeftToolbarProps) {
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  return (
    <Panel position="top-left" className="!bg-transparent !border-0 !p-0 !m-2">
      <div className="flex flex-col gap-1.5 bg-df-sidebar-bg border border-df-sidebar-border rounded-lg p-1.5 shadow-lg">
        {/* Layout Strategy Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className={`p-1.5 rounded transition-colors ${
              showLayoutMenu
                ? 'bg-df-npc-selected/20 text-df-npc-selected border border-df-npc-selected'
                : 'bg-df-elevated border border-df-control-border text-df-text-secondary hover:text-df-text-primary hover:border-df-control-hover'
            }`}
            title={`Layout: ${listLayouts().find(l => l.id === layoutStrategy)?.name || layoutStrategy}`}
          >
            <Grid3x3 size={14} />
          </button>
          {showLayoutMenu && (
            <div className="absolute left-full ml-2 top-0 z-50 bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-xl p-1 min-w-[200px]">
              <div className="text-[10px] text-df-text-secondary uppercase tracking-wider px-2 py-1 border-b border-df-sidebar-border">
                Layout Algorithm
              </div>
              {listLayouts().map(layout => (
                <button
                  key={layout.id}
                  onClick={() => {
                    if (onLayoutStrategyChange) {
                      onLayoutStrategyChange(layout.id);
                      setShowLayoutMenu(false);
                      if (onApplyLayout) {
                        setTimeout(() => onApplyLayout(), 0);
                      }
                    }
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    layoutStrategy === layout.id
                      ? 'bg-df-npc-selected/20 text-df-npc-selected'
                      : 'text-df-text-primary hover:bg-df-elevated'
                  }`}
                >
                  <div className="font-medium">
                    {layout.name} {layout.isDefault && '(default)'}
                  </div>
                  <div className="text-[10px] text-df-text-secondary mt-0.5">{layout.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {onToggleMiniMap && (
          <button
            onClick={onToggleMiniMap}
            className={`p-1.5 rounded transition-colors ${
              showMiniMap
                ? 'bg-df-npc-selected/20 text-df-npc-selected border border-df-npc-selected'
                : 'bg-df-elevated border border-df-control-border text-df-text-secondary hover:text-df-text-primary hover:border-df-control-hover'
            }`}
            title={showMiniMap ? 'Hide minimap' : 'Show minimap'}
          >
            <MapIcon size={14} />
          </button>
        )}

        {onOpenFlagManager && (
          <button
            onClick={onOpenFlagManager}
            className="p-1.5 bg-df-elevated border border-df-control-border rounded text-df-text-secondary hover:text-df-text-primary hover:border-df-control-hover transition-colors"
            title="Manage Flags"
          >
            <Settings size={14} />
          </button>
        )}

        {onOpenGuide && (
          <button
            onClick={onOpenGuide}
            className="p-1.5 bg-df-elevated border border-df-control-border rounded text-df-text-secondary hover:text-df-text-primary hover:border-df-control-hover transition-colors"
            title="Guide & Documentation"
          >
            <BookOpen size={14} />
          </button>
        )}

        {ENABLE_DEBUG_TOOLS && onLoadExampleDialogue && onLoadExampleFlags && (
          <ExampleLoaderButton
            onLoadDialogue={onLoadExampleDialogue}
            onLoadFlags={onLoadExampleFlags}
          />
        )}
      </div>
    </Panel>
  );
}
