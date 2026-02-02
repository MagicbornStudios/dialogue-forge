'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { CharacterSidebarProps, SidebarTab } from './types';
import { CharacterSidebarTabs } from './CharacterSidebarTabs';
import { CharacterSidebarSearch } from './CharacterSidebarSearch';
import { CharacterList } from './CharacterList';
import { RelationshipsList } from './RelationshipsList';

export function CharacterSidebar({
  characters,
  activeCharacterId,
  onCharacterSelect,
  onCreateCharacter,
  onAddRelationship,
  graphEditorRef,
  relationships = [],
  onRelationshipsRefresh,
  dataAdapter,
  activeProjectId,
  onGraphChange,
  className,
}: CharacterSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('characters');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCharacter = useMemo(() => {
    if (!activeCharacterId) return null;
    return characters.find((c) => c.id === activeCharacterId) ?? null;
  }, [characters, activeCharacterId]);

  const otherCharacters = useMemo(() => {
    const filtered = characters.filter((char) => char.id !== activeCharacterId);
    if (!searchQuery.trim()) return filtered;
    const query = searchQuery.toLowerCase();
    return filtered.filter(
      (char) =>
        char.name.toLowerCase().includes(query) ||
        (char.description?.toLowerCase().includes(query) ?? false)
    );
  }, [characters, activeCharacterId, searchQuery]);


  return (
    <div className={cn('h-full w-full flex flex-col bg-background border-l border-border', className)}>
      <CharacterSidebarTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        characterCount={characters.length}
        edgeCount={0}
      />
      {activeTab === 'characters' && onCreateCharacter && (
        <div className="px-2 py-1.5 border-b border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs justify-center gap-1.5"
            onClick={onCreateCharacter}
            title="Create new character"
          >
            <Plus className="h-3.5 w-3.5" />
            Create character
          </Button>
        </div>
      )}
      <CharacterSidebarSearch
        activeTab={activeTab}
        value={searchQuery}
        onChange={setSearchQuery}
      />
      {activeTab === 'characters' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto h-full">
            <CharacterList
              characters={characters}
              activeCharacter={activeCharacter}
              otherCharacters={otherCharacters}
              searchQuery={searchQuery}
              onCharacterSelect={onCharacterSelect}
              onAddRelationship={onAddRelationship}
            />
          </div>
        </div>
      )}
      {activeTab === 'relationships' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto h-full">
            <RelationshipsList
              activeCharacterId={activeCharacterId}
              graphEditorRef={graphEditorRef}
              characters={characters}
              relationships={relationships}
              onRelationshipsRefresh={onRelationshipsRefresh}
              dataAdapter={dataAdapter}
              activeProjectId={activeProjectId}
              onGraphChange={onGraphChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
