'use client';

import React, { useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { useForgeWorkspaceStore } from '@/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { useShallow } from 'zustand/shallow';
import { cn } from '@/shared/lib/utils';
import { debugRender } from '@/shared/utils/debug';

interface EditorExpandControlsProps {
  editorType: 'narrativeEditor' | 'storyletEditor' | 'nodeEditor';
  className?: string;
}

// Custom expand icon (four arrows pointing outward)
function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

// Custom minimize icon (four arrows pointing inward)
function MinimizeIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  );
}

function EditorExpandControlsComponent({ editorType, className }: EditorExpandControlsProps) {
  // Use separate selectors - actions are stable, only isDocked needs to be reactive
  const isDocked = useForgeWorkspaceStore((s) => s.panelLayout[editorType]?.isDocked ?? false);
  // Actions are stable references in Zustand, so we can select them directly
  const dockPanel = useForgeWorkspaceStore((s) => s.actions.dockPanel);
  const undockPanel = useForgeWorkspaceStore((s) => s.actions.undockPanel);
  
  // Debug logging for component render
  useEffect(() => {
    debugRender('EditorExpandControls', { editorType, isDocked });
  });

  // Memoize color class to prevent recalculation
  const iconColorClass = useMemo(() => 
    editorType === 'narrativeEditor' 
      ? 'text-[var(--color-df-info)]' 
      : editorType === 'storyletEditor'
      ? 'text-[var(--color-df-edge-choice-1)]'
      : 'text-[var(--color-df-text-secondary)]',
    [editorType]
  );

  // Memoize toggle handler to prevent function recreation
  const handleToggle = useCallback(() => {
    if (isDocked) {
      undockPanel(editorType);
    } else {
      dockPanel(editorType);
    }
  }, [isDocked, dockPanel, undockPanel, editorType]);

  // Memoize tooltip text
  const tooltipText = useMemo(() => 
    isDocked ? 'Minimize editor' : 'Expand editor to fullscreen',
    [isDocked]
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className={cn('h-7 w-7 transition-all duration-200', className)}
            title={tooltipText}
          >
            {isDocked ? (
              <MinimizeIcon className={cn('transition-all duration-200', iconColorClass)} />
            ) : (
              <ExpandIcon className={cn('transition-all duration-200', iconColorClass)} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Memoize component to prevent unnecessary re-renders
export const EditorExpandControls = React.memo(EditorExpandControlsComponent);
