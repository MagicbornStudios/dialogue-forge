import React from 'react';
import { Trash2 } from 'lucide-react';
import type { NarrativePage } from '../../types/narrative';
import { DetailField, ListItem, ListPanel } from './ListPanel';

interface PagePanelProps {
  pages: NarrativePage[];
  selectedPageId?: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<NarrativePage>) => void;
  onUpdateDialogueId: (value: string) => void;
}

export function PagePanel({
  pages,
  selectedPageId,
  onSelect,
  onAdd,
  onMove,
  onDelete,
  onUpdate,
  onUpdateDialogueId,
}: PagePanelProps) {
  const selectedPage = pages.find(page => page.id === selectedPageId);

  return (
    <ListPanel title="Pages" subtitle="Pages" onAdd={onAdd} addButtonLabel="Add Page">
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {pages.map((page, index) => (
          <ListItem
            key={page.id}
            title={page.title || `Page ${index + 1}`}
            subtitle={page.id}
            selected={page.id === selectedPageId}
            onSelect={() => onSelect(page.id)}
            onMoveUp={() => onMove('up')}
            onMoveDown={() => onMove('down')}
          />
        ))}
        {pages.length === 0 && <p className="text-xs text-gray-500">Select a chapter and add pages.</p>}
      </div>
      <div className="border-t border-[#1f1f2e] p-3 space-y-2">
        {selectedPage ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase">Page Details</span>
              <button type="button" onClick={onDelete} className="text-gray-500 hover:text-[#e94560]">
                <Trash2 size={14} />
              </button>
            </div>
            <DetailField label="ID">
              <input
                value={selectedPage.id}
                onChange={event => onUpdate({ id: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Title">
              <input
                value={selectedPage.title ?? ''}
                onChange={event => onUpdate({ title: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Summary">
              <textarea
                value={selectedPage.summary ?? ''}
                onChange={event => onUpdate({ summary: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200 min-h-[60px]"
              />
            </DetailField>
            <DetailField label="Dialogue ID">
              <input
                value={selectedPage.dialogueId}
                onChange={event => onUpdateDialogueId(event.target.value)}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
          </>
        ) : (
          <p className="text-xs text-gray-500">Select a page to edit details.</p>
        )}
      </div>
    </ListPanel>
  );
}
