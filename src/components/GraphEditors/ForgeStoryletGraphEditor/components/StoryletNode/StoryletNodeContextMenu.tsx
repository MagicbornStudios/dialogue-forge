import React from 'react';
import { Edit3, Trash2 } from 'lucide-react';

interface StoryletNodeContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  isStartNode: boolean;
  onEdit: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function StoryletNodeContextMenu({
  x,
  y,
  nodeId,
  isStartNode,
  onEdit,
  onDelete,
  onClose,
}: StoryletNodeContextMenuProps) {
  return (
    <div className="fixed z-50" style={{ left: x, top: y }}>
      <div className="bg-df-elevated border border-df-player-border rounded-lg shadow-xl py-1 min-w-[180px]">
        <div className="px-3 py-1 text-[10px] text-df-text-secondary uppercase border-b border-df-control-border">
          {nodeId}
        </div>
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          className="w-full px-4 py-2 text-sm text-left text-df-text-primary hover:bg-df-control-hover flex items-center gap-2"
        >
          <Edit3 size={14} className="text-df-npc-selected" /> Edit Node
        </button>
        {!isStartNode && onDelete && (
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="w-full px-4 py-2 text-sm text-left text-df-error hover:bg-df-control-hover flex items-center gap-2"
          >
            <Trash2 size={14} /> Delete
          </button>
        )}
        <button
          onClick={onClose}
          className="w-full px-4 py-1.5 text-xs text-df-text-secondary hover:text-df-text-primary border-t border-df-control-border mt-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
