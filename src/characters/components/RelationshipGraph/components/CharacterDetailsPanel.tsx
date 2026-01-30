'use client';

import React from 'react';
import { User } from 'lucide-react';
import type { CharacterDoc } from '@/characters/types';

interface CharacterDetailsPanelProps {
  character: CharacterDoc;
  isActiveCharacter: boolean;
  className?: string;
}

export function CharacterDetailsPanel({
  character,
  isActiveCharacter,
  className,
}: CharacterDetailsPanelProps) {
  return (
    <div className={`p-3 bg-background ${className || ''}`}>
      <div className="flex items-start gap-2 mb-2">
        <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{character.name}</div>
          {isActiveCharacter && (
            <div className="text-xs text-green-600 font-medium">Active Character</div>
          )}
        </div>
      </div>

      {character.description && (
        <div className="mt-2">
          <div className="text-xs font-medium text-muted-foreground mb-1">Description</div>
          <div className="text-xs text-muted-foreground">{character.description}</div>
        </div>
      )}

      {character.relationshipFlow && character.relationshipFlow.edges.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="text-xs font-medium text-muted-foreground mb-1">Relationships</div>
          <div className="text-xs text-muted-foreground">
            {character.relationshipFlow.edges.length} relationship
            {character.relationshipFlow.edges.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
