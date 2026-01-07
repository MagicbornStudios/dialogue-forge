import React from 'react';
import { Trash2 } from 'lucide-react';
import type { NarrativeChapter } from '../../types/narrative';
import { DetailField, ListItem, ListPanel } from './ListPanel';

interface ChapterPanelProps {
  chapters: NarrativeChapter[];
  selectedChapterId?: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<NarrativeChapter>) => void;
}

export function ChapterPanel({
  chapters,
  selectedChapterId,
  onSelect,
  onAdd,
  onMove,
  onDelete,
  onUpdate,
}: ChapterPanelProps) {
  const selectedChapter = chapters.find(chapter => chapter.id === selectedChapterId);

  return (
    <ListPanel title="Chapters" subtitle="Chapters" onAdd={onAdd} addButtonLabel="Add Chapter">
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {chapters.map((chapter, index) => (
          <ListItem
            key={chapter.id}
            title={chapter.title || `Chapter ${index + 1}`}
            subtitle={chapter.id}
            selected={chapter.id === selectedChapterId}
            onSelect={() => onSelect(chapter.id)}
            onMoveUp={() => onMove('up')}
            onMoveDown={() => onMove('down')}
          />
        ))}
        {chapters.length === 0 && <p className="text-xs text-gray-500">Select an act and add chapters.</p>}
      </div>
      <div className="border-t border-[#1f1f2e] p-3 space-y-2">
        {selectedChapter ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase">Chapter Details</span>
              <button type="button" onClick={onDelete} className="text-gray-500 hover:text-[#e94560]">
                <Trash2 size={14} />
              </button>
            </div>
            <DetailField label="ID">
              <input
                value={selectedChapter.id}
                onChange={event => onUpdate({ id: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Title">
              <input
                value={selectedChapter.title ?? ''}
                onChange={event => onUpdate({ title: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200"
              />
            </DetailField>
            <DetailField label="Summary">
              <textarea
                value={selectedChapter.summary ?? ''}
                onChange={event => onUpdate({ summary: event.target.value })}
                className="w-full bg-[#12121a] border border-[#2a2a3e] rounded px-2 py-1 text-xs text-gray-200 min-h-[60px]"
              />
            </DetailField>
          </>
        ) : (
          <p className="text-xs text-gray-500">Select a chapter to edit details.</p>
        )}
      </div>
    </ListPanel>
  );
}
