import React from 'react';
import type { ForgeNode } from '@/forge/types/forge-graph';
import type { ForgePage } from '@/forge/types/narrative';

interface ChapterNodeFieldsProps {
  node: ForgeNode;
  pages: ForgePage[];
  isLoading?: boolean;
  onUpdate: (updates: Partial<ForgeNode>) => void;
}

export function ChapterNodeFields({ node, pages, isLoading = false, onUpdate }: ChapterNodeFieldsProps) {
  const selectedChapterId = node.chapterId ?? '';

  return (
    <>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Chapter Page</label>
        <select
          value={selectedChapterId}
          onChange={(event) => {
            const nextId = event.target.value ? Number(event.target.value) : undefined;
            onUpdate({ chapterId: nextId });
          }}
          disabled={isLoading}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-chapter-accent)] outline-none"
        >
          <option value="">{isLoading ? 'Loading chapters...' : 'Select a chapter page...'}</option>
          {pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.title || `Chapter ${page.id}`}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Node Title</label>
        <input
          type="text"
          value={node.label || ''}
          onChange={(event) => onUpdate({ label: event.target.value || undefined })}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-chapter-accent)] outline-none"
          placeholder="Chapter node title"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Node Summary</label>
        <textarea
          value={node.content || ''}
          onChange={(event) => onUpdate({ content: event.target.value || undefined })}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-chapter-accent)] outline-none min-h-[100px] resize-y"
          placeholder="Chapter node summary"
        />
      </div>
    </>
  );
}
