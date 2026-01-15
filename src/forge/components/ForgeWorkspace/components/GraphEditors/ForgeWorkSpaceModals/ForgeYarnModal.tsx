import React from 'react';
import { X } from 'lucide-react';
import { YarnView } from '@/forge/components/ForgeWorkspace/components/GraphEditors/shared/YarnView';
import type { ForgeGraphDoc } from '@/forge/types/forge-graph';

interface ForgeYarnModalProps {
  isOpen: boolean;
  onClose: () => void;
  graph: ForgeGraphDoc;
  onGraphChange?: (graph: ForgeGraphDoc) => void;
}

export function ForgeYarnModal({
  isOpen,
  onClose,
  graph,
  onGraphChange,
}: ForgeYarnModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-df-editor-border bg-df-editor-bg">
        <div className="flex items-center justify-between border-b border-df-node-border px-4 py-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-df-text-tertiary">Yarn View</div>
            <div className="text-sm font-semibold text-df-text-primary">{graph.title}</div>
          </div>
          <button
            type="button"
            className="rounded-md border border-df-control-border bg-df-control-bg p-1 text-df-text-secondary hover:text-df-text-primary"
            onClick={onClose}
            title="Close Yarn view"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <YarnView
            graph={graph}
            onExport={() => {
              console.log('Export Yarn');
            }}
            onChange={onGraphChange}
          />
        </div>
      </div>
    </div>
  );
}
