import React from 'react';
import { Trash2 } from 'lucide-react';
import type { NarrativeAct } from '../../types/narrative';
import { DetailField, ListItem, ListPanel } from './ListPanel';

interface ActPanelProps {
  acts: NarrativeAct[];
  selectedActId?: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<NarrativeAct>) => void;
}

export function ActPanel({
  acts,
  selectedActId,
  onSelect,
  onAdd,
  onMove,
  onDelete,
  onUpdate,
}: ActPanelProps) {
  const selectedAct = acts.find(act => act.id === selectedActId);

  return (
    <ListPanel title="Acts" subtitle="Acts" onAdd={onAdd} addButtonLabel="Add Act">
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {acts.map((act, index) => (
          <ListItem
            key={act.id}
            title={act.title || `Act ${index + 1}`}
            subtitle={act.id}
            selected={act.id === selectedActId}
            onSelect={() => onSelect(act.id)}
            onMoveUp={() => onMove('up')}
            onMoveDown={() => onMove('down')}
          />
        ))}
        {acts.length === 0 && <p className="text-xs text-gray-500">No acts yet. Add your first act.</p>}
      </div>
      <div className="border-t border-[#1f1f2e] p-3 space-y-2">
        {selectedAct ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase">Act Details</span>
              <button type="button" onClick={onDelete} className="text-gray-500 hover:text-[#e94560]">
                <Trash2 size={14} />
              </button>
            </div>
            <DetailField label="ID">
              <input
                value={selectedAct.id}
                onChange={event => onUpdate({ id: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Title">
              <input
                value={selectedAct.title ?? ''}
                onChange={event => onUpdate({ title: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Summary">
              <textarea
                value={selectedAct.summary ?? ''}
                onChange={event => onUpdate({ summary: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200 min-h-[60px]"
              />
            </DetailField>
          </>
        ) : (
          <p className="text-xs text-gray-500">Select an act to edit details.</p>
        )}
      </div>
    </ListPanel>
  );
}
