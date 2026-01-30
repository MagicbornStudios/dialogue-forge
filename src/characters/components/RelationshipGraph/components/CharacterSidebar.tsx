'use client';

import React, { useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { CharacterDoc, RelationshipFlow } from '@/characters/types';
import { CharacterCreateDialog } from './CharacterCreateDialog';

interface CharacterSidebarProps {
  characters: CharacterDoc[];
  activeCharacterId: string;
  onCharacterSelect?: (characterId: string) => void;
  charactersInGraph: string[];
  graph: RelationshipFlow;
  onGraphChange: (graph: RelationshipFlow) => void;
  className?: string;
}

export function CharacterSidebar({
  characters,
  activeCharacterId,
  onCharacterSelect,
  charactersInGraph,
  graph,
  onGraphChange,
  className,
}: CharacterSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Filter characters based on search
  const filteredCharacters = characters.filter((char) =>
    char.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, characterId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/character', characterId);
  };

  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Characters</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCreateDialogOpen(true)}
            title="Create new character"
          >
            <Plus size={14} />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search characters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Character List */}
      <div className="flex-1 overflow-auto p-2">
        {filteredCharacters.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>No characters found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredCharacters.map((character) => {
              const isActive = character.id === activeCharacterId;
              const isInGraph = charactersInGraph.includes(character.id);

              return (
                <div
                  key={character.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, character.id)}
                  onClick={() => onCharacterSelect?.(character.id)}
                  className={`
                    p-2 rounded-md cursor-pointer transition-colors
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-accent'
                    }
                    ${isInGraph && !isActive ? 'border-l-2 border-primary' : ''}
                  `}
                  title={`Drag to add to graph${isInGraph ? ' (already in graph)' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {character.name}
                      </div>
                      {character.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {character.description.substring(0, 40)}
                          {character.description.length > 40 ? '...' : ''}
                        </div>
                      )}
                    </div>
                    {isActive && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Character Dialog */}
      <CharacterCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
