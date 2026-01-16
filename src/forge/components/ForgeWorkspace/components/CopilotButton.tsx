'use client';

import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface CopilotButtonProps {
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}

/**
 * CopilotButton - A button that fades in on hover (Notion-style)
 * Hidden by default, fades in when parent container is hovered
 */
export function CopilotButton({
  onClick,
  className,
  size = 'md',
  title = 'Open AI Assistant',
}: CopilotButtonProps) {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded transition-all duration-200',
        'bg-df-elevated border border-df-control-border',
        'text-df-text-secondary hover:text-df-text-primary',
        'hover:border-df-control-hover hover:bg-df-elevated-hover',
        'opacity-0 group-hover:opacity-100',
        sizeClasses[size],
        className
      )}
      title={title}
    >
      <Bot size={iconSizes[size]} className="transition-transform hover:scale-110" />
    </button>
  );
}

/**
 * CopilotButtonContainer - Wrapper that enables hover reveal for child CopilotButton
 * Add this class to parent containers that should reveal copilot buttons on hover
 */
export function CopilotButtonContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('group', className)}>
      {children}
    </div>
  );
}
