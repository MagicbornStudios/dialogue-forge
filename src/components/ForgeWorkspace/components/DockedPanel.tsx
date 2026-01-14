import React from 'react';
import { Minimize2 } from 'lucide-react';

interface DockedPanelProps {
  title: string;
  onUndock: () => void;
  children: React.ReactNode;
}

export function DockedPanel({ title, onUndock, children }: DockedPanelProps) {
  return (
    <div className="fixed inset-0 z-50 bg-df-editor-bg flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-df-control-border bg-df-editor-bg flex-shrink-0">
        <span className="text-sm font-medium text-df-text-primary">{title}</span>
        <button
          onClick={onUndock}
          className="p-1.5 rounded hover:bg-df-control-bg transition-colors"
          title="Undock panel"
        >
          <Minimize2 size={16} className="text-df-text-secondary" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
