import React from 'react';
import { Trash2 } from 'lucide-react';
import {
  STORYLET_SELECTION_MODE,
  type Storylet,
  type StoryletPool,
} from '../../types/narrative';
import { DetailField, ListItem, ListPanel } from './ListPanel';

interface StoryletEntry {
  poolId: string;
  storylet: Storylet;
}

interface StoryletPanelProps {
  entries: StoryletEntry[];
  pools: StoryletPool[];
  selectedKey?: string;
  selectedPool?: StoryletPool;
  onSelect: (key: string) => void;
  onAddPool: () => void;
  onAddStorylet: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onDelete: () => void;
  onUpdateStorylet: (updates: Partial<Storylet>) => void;
  onUpdatePool: (updates: Partial<StoryletPool>) => void;
  onChangePool: (poolId: string) => void;
}

export function StoryletPanel({
  entries,
  pools,
  selectedKey,
  selectedPool,
  onSelect,
  onAddPool,
  onAddStorylet,
  onMove,
  onDelete,
  onUpdateStorylet,
  onUpdatePool,
  onChangePool,
}: StoryletPanelProps) {
  const selectedEntry = entries.find(entry => `${entry.poolId}:${entry.storylet.id}` === selectedKey)
    ?? entries[0];

  return (
    <ListPanel
      title="Storylets"
      subtitle="Storylets"
      onAdd={onAddStorylet}
      addButtonLabel="Add Storylet"
      extraActions={
        <button
          type="button"
          onClick={onAddPool}
          className="px-2 py-1 bg-[#1a1a2a] hover:bg-[#242438] text-xs text-gray-200 rounded"
        >
          New Pool
        </button>
      }
    >
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {entries.map((entry, index) => (
          <ListItem
            key={`${entry.poolId}-${entry.storylet.id}`}
            title={entry.storylet.title || `Storylet ${index + 1}`}
            subtitle={entry.storylet.id}
            badge={entry.poolId}
            selected={`${entry.poolId}:${entry.storylet.id}` === selectedKey}
            onSelect={() => onSelect(`${entry.poolId}:${entry.storylet.id}`)}
            onMoveUp={() => onMove('up')}
            onMoveDown={() => onMove('down')}
          />
        ))}
        {entries.length === 0 && <p className="text-xs text-gray-500">Add storylet pools and storylets.</p>}
      </div>
      <div className="border-t border-[#1f1f2e] p-3 space-y-2">
        {selectedEntry ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase">Storylet Details</span>
              <button type="button" onClick={onDelete} className="text-gray-500 hover:text-[#e94560]">
                <Trash2 size={14} />
              </button>
            </div>
            <DetailField label="ID">
              <input
                value={selectedEntry.storylet.id}
                onChange={event => onUpdateStorylet({ id: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Title">
              <input
                value={selectedEntry.storylet.title ?? ''}
                onChange={event => onUpdateStorylet({ title: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Summary">
              <textarea
                value={selectedEntry.storylet.summary ?? ''}
                onChange={event => onUpdateStorylet({ summary: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200 min-h-[60px]"
              />
            </DetailField>
            <DetailField label="Weight">
              <input
                type="number"
                value={selectedEntry.storylet.weight ?? 1}
                onChange={event => onUpdateStorylet({ weight: Number(event.target.value) })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Next Node ID">
              <input
                value={selectedEntry.storylet.nextNodeId ?? ''}
                onChange={event => onUpdateStorylet({ nextNodeId: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>

            <div className="pt-2 border-t border-[#1f1f2e] space-y-2">
              <span className="text-[10px] text-gray-500 uppercase">Storylet Pool</span>
              <select
                value={selectedEntry.poolId}
                onChange={event => onChangePool(event.target.value)}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              >
                {pools.map(pool => (
                  <option key={pool.id} value={pool.id}>
                    {pool.title || pool.id}
                  </option>
                ))}
              </select>
              {selectedPool && (
                <>
                  <DetailField label="Pool Title">
                    <input
                      value={selectedPool.title ?? ''}
                      onChange={event => onUpdatePool({ title: event.target.value })}
                      className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                    />
                  </DetailField>
                  <DetailField label="Selection Mode">
                    <select
                      value={selectedPool.selectionMode ?? STORYLET_SELECTION_MODE.WEIGHTED}
                      onChange={event =>
                        onUpdatePool({
                          selectionMode: event.target.value as StoryletPool['selectionMode'],
                        })
                      }
                      className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                    >
                      <option value={STORYLET_SELECTION_MODE.WEIGHTED}>Weighted</option>
                      <option value={STORYLET_SELECTION_MODE.SEQUENTIAL}>Sequential</option>
                      <option value={STORYLET_SELECTION_MODE.RANDOM}>Random</option>
                    </select>
                  </DetailField>
                  <DetailField label="Fallback Node ID">
                    <input
                      value={selectedPool.fallbackNodeId ?? ''}
                      onChange={event => onUpdatePool({ fallbackNodeId: event.target.value })}
                      className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
                    />
                  </DetailField>
                </>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-500">Select a storylet to edit details.</p>
        )}
      </div>
    </ListPanel>
  );
}
