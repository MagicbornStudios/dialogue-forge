import React from 'react';
import { ForgePage } from '../../../../../types/narrative';

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
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none"
          placeholder="Page title"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Summary</label>
        <textarea
          value={page.summary || ''}
          onChange={(event) => onUpdate({ summary: event.target.value || undefined })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none min-h-[100px] resize-y"
          placeholder="Page summary"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Dialogue ID</label>
        <input
          type="text"
          value={page.dialogueId || ''}
          onChange={(event) => onUpdate({ dialogueId: event.target.value })}
          className="w-full bg-df-elevated border border-df-control-border rounded px-2 py-1 text-sm text-df-text-primary focus:border-df-npc-selected outline-none font-mono"
          placeholder="dialogue_id"
        />
      </div>
    </>
  );
}
