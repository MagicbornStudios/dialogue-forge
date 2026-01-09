import React from 'react';
import { ContextMenuBase, ContextMenuButton } from '../../../EditorComponents/shared/ContextMenuBase';

// Pages are terminal nodes - they don't connect to other narrative elements
// This menu exists for consistency but will typically be empty or show a message
interface PageEdgeDropMenuProps {
  x: number;
  y: number;
  graphX: number;
  graphY: number;
  fromNodeId: string;
  onAddElement: (type: any, x: number, y: number, autoConnect?: { fromNodeId: string }) => void;
  onClose: () => void;
}

export function PageEdgeDropMenu({
  x,
  y,
  graphX,
  graphY,
  fromNodeId,
  onAddElement,
  onClose,
}: PageEdgeDropMenuProps) {
  return (
    <ContextMenuBase x={x} y={y} title="Create Element">
      <div className="px-3 py-2 text-sm text-df-text-secondary italic">
        Pages are terminal nodes
      </div>
      <ContextMenuButton onClick={onClose} variant="secondary">
        Close
      </ContextMenuButton>
    </ContextMenuBase>
  );
}
