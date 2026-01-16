import React from 'react';
import { ForgeChapter } from '@/forge/types/narrative';

interface ChapterNodeFieldsProps {
  chapter: ForgeChapter;
  onUpdate: (updates: Partial<ForgeChapter>) => void;
}

export function ChapterNodeFields({ chapter, onUpdate }: ChapterNodeFieldsProps) {
  return (
    <>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Title</label>
        <input
          type="text"
          value={chapter.title || ''}
          onChange={(event) => onUpdate({ title: event.target.value || undefined })}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-chapter-accent)] outline-none"
          placeholder="Chapter title"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Summary</label>
        <textarea
          value={chapter.summary || ''}
          onChange={(event) => onUpdate({ summary: event.target.value || undefined })}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-chapter-accent)] outline-none min-h-[100px] resize-y"
          placeholder="Chapter summary"
        />
      </div>
    </>
  );
}
