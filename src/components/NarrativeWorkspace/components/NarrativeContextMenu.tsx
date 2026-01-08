"use client"

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';

interface NarrativeContextMenuProps {
  x: number;
  y: number;
  onAddAct: () => void;
  onAddChapter: () => void;
  onAddPage: () => void;
  canAddChapter: boolean;
  canAddPage: boolean;
  onClose: () => void;
}

export function NarrativeContextMenu({
  x,
  y,
  onAddAct,
  onAddChapter,
  onAddPage,
  canAddChapter,
  canAddPage,
  onClose,
}: NarrativeContextMenuProps) {
  return (
    <DropdownMenu
      open
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          style={{ position: 'fixed', top: y, left: x, width: 1, height: 1 }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={0}>
        <DropdownMenuItem
          onSelect={() => {
            onAddAct();
            onClose();
          }}
        >
          Add Act
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!canAddChapter}
          onSelect={() => {
            onAddChapter();
            onClose();
          }}
        >
          Add Chapter
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!canAddPage}
          onSelect={() => {
            onAddPage();
            onClose();
          }}
        >
          Add Page
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
