'use client';

import React from 'react';
import { Button } from '@magicborn/shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@magicborn/shared/ui/tooltip';
import { useForgeWorkspaceStore } from '@magicborn/forge/components/ForgeWorkspace/store/forge-workspace-store';
import { cn } from '@magicborn/shared/lib/utils';

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

export function EditorExpandControls({ editorType, className }: EditorExpandControlsProps) {
  const panelLayout = useForgeWorkspaceStore((s) => s.panelLayout[editorType]);
  const dockPanel = useForgeWorkspaceStore((s) => s.actions.dockPanel);
  const undockPanel = useForgeWorkspaceStore((s) => s.actions.undockPanel);

  const isDocked = panelLayout?.isDocked ?? false;

  // Determine color based on editor type
  const iconColorClass = 
    editorType === 'narrativeEditor' 
      ? 'text-[var(--color-df-info)]' 
      : editorType === 'storyletEditor'
      ? 'text-[var(--color-df-edge-choice-1)]'
      : 'text-[var(--color-df-text-secondary)]';

  const handleToggle = () => {
    if (isDocked) {
      undockPanel(editorType);
    } else {
      dockPanel(editorType);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          className={cn('h-7 w-7 transition-all duration-200', className)}
          title={isDocked ? 'Minimize editor' : 'Expand editor to fullscreen'}
        >
          {isDocked ? (
            <MinimizeIcon className={cn('transition-all duration-200', iconColorClass)} />
          ) : (
            <ExpandIcon className={cn('transition-all duration-200', iconColorClass)} />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isDocked ? 'Minimize editor' : 'Expand editor to fullscreen'}</p>
      </TooltipContent>
    </Tooltip>
  );
}
