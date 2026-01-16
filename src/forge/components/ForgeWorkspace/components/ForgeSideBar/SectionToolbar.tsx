'use client';

import React from 'react';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { cn } from '@/shared/lib/utils';

export interface SectionToolbarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tooltip?: string;
  disabled?: boolean;
  variant?: 'default' | 'ghost' | 'outline';
}

interface SectionToolbarProps {
  actions: SectionToolbarAction[];
  className?: string;
}

/**
 * Reusable section toolbar component for sidebar sections
 * Similar to VSCode, Photoshop, and ReactFlow toolbar patterns
 * Supports multiple actions with tooltips
 */
export function SectionToolbar({ actions, className }: SectionToolbarProps) {
  if (actions.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {actions.map((action) => {
        const button = (
          <Button
            key={action.id}
            variant={action.variant || 'ghost'}
            size="icon"
            className="h-6 w-6"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.icon}
          </Button>
        );

        if (action.tooltip) {
          return (
            <TooltipProvider key={action.id}>
              <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent>
                  <p>{action.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        return button;
      })}
    </div>
  );
}
