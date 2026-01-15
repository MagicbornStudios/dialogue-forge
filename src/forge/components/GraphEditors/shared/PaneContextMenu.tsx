// src/components/graphing/core/menus/PaneContextMenu.tsx
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';

export function PaneContextMenu(props: {
  open: boolean;
  x: number;
  y: number;
  items: Array<{ type: string; label: string }>;
  onSelect: (type: string) => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { open, x, y, items, onSelect, onClose, children } = props;

  if (!open) return <>{children}</>;

  return (
    <ContextMenu onOpenChange={(v) => { if (!v) onClose(); }}>
      <ContextMenuTrigger asChild>
        <div style={{ width: '100%', height: '100%' }}>{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent
        className="w-56"
        style={{ position: 'fixed', left: x, top: y, zIndex: 50 }}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {items.map((it) => (
          <ContextMenuItem key={it.type} onSelect={() => onSelect(it.type)}>
            Add {it.label}
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
