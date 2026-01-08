import React from 'react';
import { X } from 'lucide-react';
import { STORYLET_SELECTION_MODE } from '../../../types/narrative';
import type { StoryletPool } from '../../../types/narrative';

interface PoolEditorModalProps {
  isOpen: boolean;
  pool: StoryletPool | null;
  onClose: () => void;
  onUpdate: (poolId: string, updates: Partial<StoryletPool>) => void;
}

export function PoolEditorModal({
  isOpen,
  pool,
  onClose,
  onUpdate,
}: PoolEditorModalProps) {
  if (!isOpen || !pool) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-df-editor-border bg-df-editor-bg">
        <div className="flex items-center justify-between border-b border-df-node-border px-4 py-3">
          <div className="text-sm font-semibold text-df-text-primary">Pool Details</div>
          <button
            type="button"
            className="rounded-md border border-df-control-border bg-df-control-bg p-1 text-df-text-secondary hover:text-df-text-primary"
            onClick={onClose}
            title="Close pool editor"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 p-4 text-xs text-df-text-secondary">
          <label className="flex flex-col gap-1">
            <span>Title</span>
            <input
              value={pool.title ?? ''}
              onChange={event => onUpdate(pool.id, { title: event.target.value })}
              className="rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-df-text-primary"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Summary</span>
            <textarea
              value={pool.summary ?? ''}
              onChange={event => onUpdate(pool.id, { summary: event.target.value })}
              className="min-h-[80px] rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-df-text-primary"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Selection Mode</span>
            <select
              value={pool.selectionMode ?? STORYLET_SELECTION_MODE.WEIGHTED}
              onChange={event =>
                onUpdate(pool.id, {
                  selectionMode: event.target.value as StoryletPool['selectionMode'],
                })
              }
              className="rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-df-text-primary"
            >
              {Object.values(STORYLET_SELECTION_MODE).map(mode => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
