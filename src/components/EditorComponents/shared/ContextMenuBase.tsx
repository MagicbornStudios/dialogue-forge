import React from 'react';

interface ContextMenuBaseProps {
  x: number;
  y: number;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function ContextMenuBase({ x, y, title, children, className = '' }: ContextMenuBaseProps) {
  return (
    <div className="fixed z-50" style={{ left: x, top: y }}>
      <div className={`bg-df-sidebar-bg border border-df-sidebar-border rounded-lg shadow-lg p-1 min-w-[150px] ${className}`}>
        {title && (
          <div className="px-3 py-1 text-[10px] text-df-text-secondary uppercase border-b border-df-sidebar-border">
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
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
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}
