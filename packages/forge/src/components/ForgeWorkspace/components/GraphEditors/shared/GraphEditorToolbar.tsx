'use client';

import React from 'react';
import { Plus, BookOpen, Layers } from 'lucide-react';
import { Button } from '@magicborn/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@magicborn/shared/ui/tooltip';
import { cn } from '@magicborn/shared/lib/utils';

interface GraphEditorToolbarProps {
  scope: 'narrative' | 'storylet';
  onCreateNew?: () => void;
  className?: string;
}

/**
 * Toolbar for graph editors (outside ReactFlow)
 * Shows graph name and create button
 */
export function GraphEditorToolbar({ scope, onCreateNew, className }: GraphEditorToolbarProps) {
  const Icon = scope === 'narrative' ? BookOpen : Layers;
  const label = scope === 'narrative' ? 'Narrative' : 'Storylet';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {onCreateNew && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCreateNew}
              className="h-7 px-2 text-xs"
              title={`Create a new ${label.toLowerCase()}`}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New {label}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Create a new {label.toLowerCase()}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
