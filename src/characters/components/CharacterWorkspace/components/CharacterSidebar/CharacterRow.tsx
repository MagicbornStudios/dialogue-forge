'use client';

import React from 'react';
import { Users, Edit, Link2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import { cn } from '@/shared/lib/utils';
import type { CharacterDoc } from '@/characters/types';

interface CharacterRowProps {
  character: CharacterDoc;
  isActive?: boolean;
  onSelect?: (characterId: string) => void;
  onAddRelationship?: (character: CharacterDoc) => void;
}

export function CharacterRow({
  character,
  isActive,
  onSelect,
  onAddRelationship,
}: CharacterRowProps) {
  const content = (
    <div
      onDoubleClick={() => onSelect?.(character.id)}
      className={cn(
        'w-full px-2 py-1.5 text-left text-xs transition-colors duration-200',
        isActive
          ? 'bg-muted text-foreground border-l-2 border-[var(--editor-border-active)] cursor-pointer'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:border-l-2 hover:border-[var(--editor-border-hover)] cursor-pointer'
      )}
    >
      <div className="flex items-center gap-1.5 truncate">
        <Users
          size={12}
          className={cn('shrink-0', isActive ? 'text-[var(--editor-info)]' : 'text-muted-foreground')}
        />
        <span className="truncate font-medium">{character.name}</span>
      </div>
      {character.description && (
        <div className="text-[10px] text-muted-foreground mt-0.5 truncate pl-3.5">
          {character.description}
        </div>
      )}
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{content}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => onSelect?.(character.id)}>
          <Edit size={14} className="mr-2" />
          Edit
        </ContextMenuItem>
        {onAddRelationship && !isActive && (
          <ContextMenuItem onSelect={() => onAddRelationship(character)}>
            <Link2 size={14} className="mr-2" />
            Add relationship
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
