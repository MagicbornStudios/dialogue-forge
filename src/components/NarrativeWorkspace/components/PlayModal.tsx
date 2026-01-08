import React from 'react';
import { X } from 'lucide-react';
import { PlayView } from '../../PlayView';
import type { DialogueTree } from '../../../types';
import type { BaseGameState } from '../../../types/game-state';
import type { FlagSchema } from '../../../types/flags';
import type { StoryThread } from '../../../types/narrative';

interface PlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  dialogue: DialogueTree;
  flagSchema?: FlagSchema;
  gameStateFlags?: BaseGameState['flags'];
  narrativeThread: StoryThread;
  title: string;
  subtitle: string;
}

export function PlayModal({
  isOpen,
  onClose,
  dialogue,
  flagSchema,
  gameStateFlags,
  narrativeThread,
  title,
  subtitle,
}: PlayModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-df-editor-border bg-df-editor-bg">
        <div className="flex items-center justify-between border-b border-df-node-border px-4 py-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-df-text-tertiary">Play</div>
            <div className="text-sm font-semibold text-df-text-primary">{title}</div>
            <div className="text-xs text-df-text-secondary">{subtitle}</div>
          </div>
          <button
            type="button"
            className="rounded-md border border-df-control-border bg-df-control-bg p-1 text-df-text-secondary hover:text-df-text-primary"
            onClick={onClose}
            title="Close play view"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <PlayView
            dialogue={dialogue}
            startNodeId={dialogue.startNodeId}
            flagSchema={flagSchema}
            gameStateFlags={gameStateFlags}
            narrativeThread={narrativeThread}
          />
        </div>
      </div>
    </div>
  );
}
