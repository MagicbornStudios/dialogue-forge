import React from 'react';
import { BookOpen, Info, Search, Plus, ExternalLink } from 'lucide-react';
import type { NarrativeSelection } from '../../../types/narrative';
import { Button } from '@/src/components/ui/button';

interface StoryletEntry {
  poolId: string;
  member: any;
  template: any;
}

interface StoryletsSidebarProps {
  storyletTab: 'storylets' | 'pools';
  storyletSearch: string;
  poolSearch: string;
  selection: NarrativeSelection;
  filteredStoryletEntries: StoryletEntry[];
  filteredPools: any[];
  activePool: any;
  onTabChange: (tab: 'storylets' | 'pools') => void;
  onStoryletSearchChange: (query: string) => void;
  onPoolSearchChange: (query: string) => void;
  onAddStorylet: () => void;
  onAddPool: () => void;
  onStoryletSelect: (entry: StoryletEntry) => void;
  onStoryletEdit: (entry: StoryletEntry) => void;
  onStoryletOpenDialogue: (entry: StoryletEntry) => void;
  onStoryletContextMenu: (event: React.MouseEvent, entry: StoryletEntry) => void;
  onPoolSelect: (poolId: string) => void;
  onPoolEdit: (poolId: string) => void;
}

export function StoryletsSidebar({
  storyletTab,
  storyletSearch,
  poolSearch,
  filteredStoryletEntries,
  filteredPools,
  selection,
  activePool,
  onTabChange,
  onStoryletSearchChange,
  onPoolSearchChange,
  onAddStorylet,
  onAddPool,
  onStoryletSelect,
  onStoryletEdit,
  onStoryletOpenDialogue,
  onStoryletContextMenu,
  onPoolSelect,
  onPoolEdit,
}: StoryletsSidebarProps) {
  return (
    <div className="flex w-[320px] min-w-[280px] flex-col gap-2">
      <div className="flex items-center justify-between rounded-lg border border-df-node-border bg-df-editor-bg px-2 py-1.5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-df-text-tertiary">
          <BookOpen size={12} />
          Storylets
          <span title="Manage storylets and pools for the selected chapter.">
            <Info size={12} />
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            className={`rounded-md px-2 py-1 ${storyletTab === 'storylets' ? 'bg-df-control-active text-df-text-primary' : 'text-df-text-secondary'}`}
            onClick={() => onTabChange('storylets')}
            title="Storylets tab"
          >
            Storylets
          </button>
          <button
            type="button"
            className={`rounded-md px-2 py-1 ${storyletTab === 'pools' ? 'bg-df-control-active text-df-text-primary' : 'text-df-text-secondary'}`}
            onClick={() => onTabChange('pools')}
            title="Pools tab"
          >
            Pools
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 rounded-lg border border-df-node-border bg-df-editor-bg p-2">
        {storyletTab === 'storylets' ? (
          <div className="flex h-full flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2 top-2.5 text-df-text-tertiary" />
                <input
                  value={storyletSearch}
                  onChange={event => onStoryletSearchChange(event.target.value)}
                  placeholder="Search storylets..."
                  className="w-full rounded-md border border-df-control-border bg-df-control-bg py-2 pl-7 pr-2 text-xs text-df-text-primary"
                />
              </div>
              <button
                type="button"
                className="flex items-center justify-center rounded-md border border-df-control-border bg-df-control-bg p-2 text-df-text-secondary hover:text-df-text-primary"
                onClick={onAddStorylet}
                title="Add storylet"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredStoryletEntries.map(entry => {
                const isSelected = selection.storyletKey === `${entry.poolId}:${entry.template.id}`;
                return (
                  <button
                    key={entry.template.id}
                    type="button"
                    onClick={() => onStoryletSelect(entry)}
                    onContextMenu={event => onStoryletContextMenu(event, entry)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                      isSelected ? 'border-df-node-selected bg-df-control-active/30 text-df-text-primary' : 'border-df-node-border text-df-text-secondary hover:border-df-node-selected'
                    }`}
                    title="Select storylet"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold">{entry.template.title ?? entry.template.id}</div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={event => {
                            event.stopPropagation();
                            onStoryletOpenDialogue(entry);
                          }}
                          title="Open storylet dialogue"
                        >
                          <ExternalLink size={14} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={event => {
                            event.stopPropagation();
                            onStoryletEdit(entry);
                          }}
                          title="Edit storylet metadata"
                        >
                          <Info size={14} />
                        </Button>
                      </div>
                    </div>
                    <div className="text-[10px] text-df-text-tertiary">{entry.template.id}</div>
                  </button>
                );
              })}
              {filteredStoryletEntries.length === 0 && (
                <div className="rounded-lg border border-df-node-border bg-df-control-bg p-3 text-xs text-df-text-tertiary">
                  No storylets found.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2 top-2.5 text-df-text-tertiary" />
                <input
                  value={poolSearch}
                  onChange={event => onPoolSearchChange(event.target.value)}
                  placeholder="Search pools..."
                  className="w-full rounded-md border border-df-control-border bg-df-control-bg py-2 pl-7 pr-2 text-xs text-df-text-primary"
                />
              </div>
              <button
                type="button"
                className="flex items-center justify-center rounded-md border border-df-control-border bg-df-control-bg p-2 text-df-text-secondary hover:text-df-text-primary"
                onClick={onAddPool}
                title="Add pool"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredPools.map((pool: any) => {
                const isSelected = activePool?.id === pool.id;
                return (
                  <button
                    key={pool.id}
                    type="button"
                    onClick={() => onPoolSelect(pool.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
                      isSelected ? 'border-df-node-selected bg-df-control-active/30 text-df-text-primary' : 'border-df-node-border text-df-text-secondary hover:border-df-node-selected'
                    }`}
                    title="Select pool"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold">{pool.title ?? pool.id}</div>
                      <button
                        type="button"
                        className="text-df-text-tertiary hover:text-df-text-primary"
                        onClick={event => {
                          event.stopPropagation();
                          onPoolEdit(pool.id);
                        }}
                        title="Edit pool"
                      >
                        <Info size={14} />
                      </button>
                    </div>
                    <div className="text-[10px] text-df-text-tertiary">{pool.members.length} storylets</div>
                  </button>
                );
              })}
              {filteredPools.length === 0 && (
                <div className="rounded-lg border border-df-node-border bg-df-control-bg p-3 text-xs text-df-text-tertiary">
                  No pools found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
