'use client';

import React from 'react';
import { Bot } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/shared/ui/tooltip';
import { Kbd, KbdGroup } from '@/shared/ui/kbd';

interface CopilotButtonProps {
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}

/**
 * CopilotButton - A button that fades in on hover (Notion-style)
 * Hidden by default, fades in when parent container is hovered
 * Shows tooltip with hotkey hint
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

  // Detect OS for modifier key display
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? '⌘' : 'Ctrl';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
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
          >
            <Bot size={iconSizes[size]} className="transition-transform hover:scale-110" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex items-center gap-2">
            <span>{title}</span>
            <KbdGroup>
              <Kbd>{modifierKey}</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
