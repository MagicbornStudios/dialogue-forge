import React from 'react';
import { X } from 'lucide-react';
import { PlayView } from '@magicborn/forge/components/ForgeWorkspace/components/GraphEditors/shared/PlayView';
import type { ForgeGraphDoc } from '@magicborn/forge/types/forge-graph';
import type { ForgeGameState } from '@magicborn/shared/types/forge-game-state';
import type { FlagSchema } from '@magicborn/forge/types/flags';

interface ForgePlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  graph: ForgeGraphDoc;
  flagSchema?: FlagSchema;
  gameState?: ForgeGameState;
  title: string;
  subtitle: string;
}

export function ForgePlayModal({
  isOpen,
  onClose,
  graph: graph,
  flagSchema,
  gameState,
  title,
  subtitle,
}: ForgePlayModalProps) {
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
            graph={graph}
            startNodeId={graph.startNodeId}
            flagSchema={flagSchema}
            gameState={gameState}
          />
        </div>
      </div>
    </div>
  );
}
