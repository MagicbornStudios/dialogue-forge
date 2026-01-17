import React from 'react';
import { ForgeAct } from '@/forge/types/narrative';

interface ActNodeFieldsProps {
  act: ForgeAct;
  onUpdate: (updates: Partial<ForgeAct>) => void;
}

export function ActNodeFields({ act, onUpdate }: ActNodeFieldsProps) {
  return (
    <>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Title</label>
        <input
          type="text"
          value={act.title || ''}
          onChange={(event) => onUpdate({ title: event.target.value || undefined })}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-act-accent)] outline-none"
          placeholder="Act title"
        />
      </div>
      <div>
        <label className="text-[10px] text-gray-500 uppercase">Summary</label>
        <textarea
          value={act.summary || ''}
          onChange={(event) => onUpdate({ summary: event.target.value || undefined })}
          className="w-full bg-card border border-border rounded px-2 py-1 text-sm text-foreground focus:border-[var(--node-act-accent)] outline-none min-h-[100px] resize-y"
          placeholder="Act summary"
        />
      </div>
    </>
  );
}
