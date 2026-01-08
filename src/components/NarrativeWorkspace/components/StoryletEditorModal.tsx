import React from 'react';
import { X } from 'lucide-react';
import type { StoryletTemplate, StoryletPoolMember } from '../../../types/narrative';

interface StoryletEntry {
  poolId: string;
  member: StoryletPoolMember;
  template: StoryletTemplate;
}

interface StoryletEditorModalProps {
  isOpen: boolean;
  entry: StoryletEntry | null;
  onClose: () => void;
  onUpdateTemplate: (entry: StoryletEntry, updates: Partial<StoryletTemplate>) => void;
  onUpdateMember: (entry: StoryletEntry, updates: Partial<StoryletPoolMember>) => void;
}

export function StoryletEditorModal({
  isOpen,
  entry,
  onClose,
  onUpdateTemplate,
  onUpdateMember,
}: StoryletEditorModalProps) {
  if (!isOpen || !entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-df-editor-border bg-df-editor-bg">
        <div className="flex items-center justify-between border-b border-df-node-border px-4 py-3">
          <div className="text-sm font-semibold text-df-text-primary">Storylet Details</div>
          <button
            type="button"
            className="rounded-md border border-df-control-border bg-df-control-bg p-1 text-df-text-secondary hover:text-df-text-primary"
            onClick={onClose}
            title="Close storylet editor"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 p-4 text-xs text-df-text-secondary">
          <label className="flex flex-col gap-1">
            <span>Title</span>
            <input
              value={entry.template.title ?? ''}
              onChange={event => onUpdateTemplate(entry, { title: event.target.value })}
              className="rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-df-text-primary"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Summary</span>
            <textarea
              value={entry.template.summary ?? ''}
              onChange={event => onUpdateTemplate(entry, { summary: event.target.value })}
              className="min-h-[80px] rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-df-text-primary"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Dialogue ID</span>
            <input
              value={entry.template.dialogueId}
              onChange={event => onUpdateTemplate(entry, { dialogueId: event.target.value })}
              className="rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-df-text-primary"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Weight</span>
            <input
              type="number"
              value={entry.member.weight ?? 1}
              onChange={event => onUpdateMember(entry, { weight: Number(event.target.value) })}
              className="rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-df-text-primary"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
