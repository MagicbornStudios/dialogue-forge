'use client';

import React from 'react';
import { Badge } from '@/shared/ui/badge';
import type { CharacterDoc } from '@/characters/types';
import { Users } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { RelationshipGraphEditorBlankRef } from './RelationshipGraphEditorBlank';

interface CharacterDetailsPanelProps {
  character: CharacterDoc | null;
  isActiveCharacter?: boolean;
  /** Ref to the graph editor: getGraph() for JointJS API, getJointGraphJson() for save/load. */
  graphEditorRef?: React.RefObject<RelationshipGraphEditorBlankRef | null>;
  className?: string;
}

export function CharacterDetailsPanel({
  character,
  isActiveCharacter = false,
  graphEditorRef,
  className,
}: CharacterDetailsPanelProps) {
  if (!character) {
    return null;
  }

  // Get display image URL (prefer avatarUrl, fallback to imageUrl)
  const displayImageUrl = character.avatarUrl || character.imageUrl;

  return (
    <div 
      className={cn('w-full bg-background flex flex-col', className)}
      style={{
        borderTop: '4px solid var(--color-df-border-selected)',
      }}
    >
      {/* Top Half - Full Width Image */}
      <div className="w-full h-32 bg-muted relative overflow-hidden flex-shrink-0">
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt={character.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.parentElement) {
                const placeholder = document.createElement('div');
                placeholder.className = 'w-full h-full flex items-center justify-center bg-muted';
                placeholder.innerHTML = '<svg class="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
                target.parentElement.appendChild(placeholder);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Bottom Half - Character Details */}
      <div className="p-4 space-y-2 flex-1 min-h-0">
        {/* Character Name and Badge */}
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold truncate flex-1">{character.name}</h3>
          {isActiveCharacter && (
            <Badge variant="default" className="text-xs shrink-0">
              Active
            </Badge>
          )}
        </div>

        {/* Description */}
        {character.description && (
          <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
            {character.description}
          </p>
        )}
      </div>
    </div>
  );
}
