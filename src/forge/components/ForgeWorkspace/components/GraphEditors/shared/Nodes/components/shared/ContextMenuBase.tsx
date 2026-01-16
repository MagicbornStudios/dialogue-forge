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
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose?.();
    }
  };

  return (
    <ContextMenu onOpenChange={handleOpenChange}>
      <ContextMenuContent
        className={cn(
          'bg-popover border border-border rounded-lg shadow-lg p-1 min-w-[150px]',
          className
        )}
        style={{ position: 'fixed', left: x, top: y, zIndex: 50 }}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {title && (
          <ContextMenuLabel className="px-3 py-1 text-[10px] text-muted-foreground uppercase border-b border-border">
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
    ? 'w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded'
    : 'w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-accent rounded';
  
  return (
    <ContextMenuItem onSelect={onClick} className={className}>
      {children}
    </ContextMenuItem>
  );
}
