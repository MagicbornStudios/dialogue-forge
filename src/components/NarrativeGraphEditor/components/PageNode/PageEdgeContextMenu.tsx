import React from 'react';
import { ContextMenuBase, ContextMenuButton } from '../../../EditorComponents/shared/ContextMenuBase';

// Pages are terminal nodes - they don't connect to other narrative elements
// This menu exists for consistency but will typically be empty or show a message
interface PageEdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  graphX: number;
  graphY: number;
  onInsertElement: (type: any, edgeId: string, x: number, y: number) => void;
  onClose: () => void;
}

export function PageEdgeContextMenu({
  x,
  y,
  edgeId,
  graphX,
  graphY,
  onInsertElement,
  onClose,
}: PageEdgeContextMenuProps) {
  return (
    <ContextMenuBase x={x} y={y} title="Insert Element">
      <div className="px-3 py-2 text-sm text-df-text-secondary italic">
        Pages are terminal nodes
      </div>
      <ContextMenuButton onClick={onClose} variant="secondary">
        Close
      </ContextMenuButton>
    </ContextMenuBase>
  );
}
