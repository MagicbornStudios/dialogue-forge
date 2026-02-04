import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FORGE_NODE_TYPE, type ForgeNodeType } from '@magicborn/forge/types/forge-graph';
import { FORGE_NODE_TYPE_LABELS } from '@magicborn/forge/types/ui-constants';
import { cn } from '@magicborn/shared/lib/utils';

interface ForgeStoryletGraphEditorPaneContextMenuProps {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
  onAddNode: (type: ForgeNodeType, x: number, y: number) => void;
  onClose: () => void;
  open: boolean;
}

// Available node types from pane context menu
const availableNodeTypes: ForgeNodeType[] = [
  FORGE_NODE_TYPE.CHARACTER,
  FORGE_NODE_TYPE.PLAYER,
  FORGE_NODE_TYPE.CONDITIONAL,
];

export function ForgeStoryletGraphEditorPaneContextMenu({
  x,
  y,
  graphX,
  graphY,
  onAddNode,
  onClose,
  open,
}: ForgeStoryletGraphEditorPaneContextMenuProps) {
  // Handle escape key and outside clicks
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const menu = document.querySelector('[data-pane-context-menu]');
      if (menu && !menu.contains(target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  if (!open || typeof window === 'undefined') return null;

  const menuContent = (
    <div
      data-pane-context-menu
      className="bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-lg p-1 min-w-[150px]"
      style={{ position: 'fixed', left: x, top: y, zIndex: 9999 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {availableNodeTypes.map(type => (
        <button
          key={type}
          onClick={() => {
            onAddNode(type, graphX, graphY);
            onClose();
          }}
          className="w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded transition-colors"
        >
          Add {FORGE_NODE_TYPE_LABELS[type]}
        </button>
      ))}
      <button
        onClick={onClose}
        className="w-full text-left px-3 py-2 text-sm text-df-text-secondary hover:bg-df-elevated rounded transition-colors"
      >
        Cancel
      </button>
    </div>
  );

  return createPortal(menuContent, document.body);
}
