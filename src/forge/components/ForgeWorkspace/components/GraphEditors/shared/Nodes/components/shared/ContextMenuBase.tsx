import React from 'react';
import { cn } from '@/shared/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
} from '@/shared/ui/context-menu';

interface ContextMenuBaseProps {
  x: number;
  y: number;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export function ContextMenuBase({
  x,
  y,
  title,
  children,
  className = '',
  onClose,
}: ContextMenuBaseProps) {
  return (
    <ContextMenu open onOpenChange={(open) => { if (!open) onClose?.(); }}>
      <ContextMenuContent
        className={cn(
          'bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-lg p-1 min-w-[150px]',
          className
        )}
        style={{ position: 'fixed', left: x, top: y, zIndex: 50 }}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {title && (
          <ContextMenuLabel className="px-3 py-1 text-[10px] text-df-text-secondary uppercase border-b border-df-sidebar-border">
            {title}
          </ContextMenuLabel>
        )}
        {children}
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface ContextMenuButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function ContextMenuButton({ onClick, children, variant = 'primary' }: ContextMenuButtonProps) {
  const className = variant === 'primary'
    ? 'w-full text-left px-3 py-2 text-sm text-df-text-primary hover:bg-df-elevated rounded'
    : 'w-full text-left px-3 py-2 text-sm text-df-text-secondary hover:bg-df-elevated rounded';
  
  return (
    <ContextMenuItem onSelect={onClick} className={className}>
      {children}
    </ContextMenuItem>
  );
}
