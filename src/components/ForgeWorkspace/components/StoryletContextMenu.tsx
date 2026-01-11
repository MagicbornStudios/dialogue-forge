"use client"

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';

interface StoryletEntry {
  poolId: string;
  member: any;
  template: any;
}

interface StoryletContextMenuProps {
  x: number;
  y: number;
  entry: StoryletEntry;
  onLoadDialogue: () => void;
  onEditMetadata: () => void;
  onClose: () => void;
}

export function StoryletContextMenu({
  x,
  y,
  entry,
  onLoadDialogue,
  onEditMetadata,
  onClose,
}: StoryletContextMenuProps) {
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
            onLoadDialogue();
            onClose();
          }}
        >
          Load Dialogue Graph
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            onEditMetadata();
            onClose();
          }}
        >
          Edit Metadata
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
