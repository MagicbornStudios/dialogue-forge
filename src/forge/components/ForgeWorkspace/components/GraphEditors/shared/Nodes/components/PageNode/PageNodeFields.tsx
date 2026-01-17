import React from 'react';
import { ForgePage } from '@/forge/types/narrative';

interface PageNodeFieldsProps {
  page: ForgePage;
  onUpdate: (updates: Partial<ForgePage>) => void;
}

export function PageNodeFields({ page, onUpdate }: PageNodeFieldsProps) {
  return (
    <>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Title</label>
        <input
          type="text"
          value={page.title || ''}
          onChange={(event) => onUpdate({ title: event.target.value || undefined })}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-page-accent)] outline-none"
          placeholder="Page title"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Summary</label>
        <textarea
          value={page.summary || ''}
          onChange={(event) => onUpdate({ summary: event.target.value || undefined })}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-page-accent)] outline-none min-h-[100px] resize-y"
          placeholder="Page summary"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Dialogue Graph ID</label>
        <input
          type="number"
          value={page.dialogueGraph || ''}
          onChange={(event) => onUpdate({ dialogueGraph: event.target.value ? Number(event.target.value) : null })}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-page-accent)] outline-none font-mono"
          placeholder="dialogue_graph_id"
        />
      </div>
    </>
  );
}
