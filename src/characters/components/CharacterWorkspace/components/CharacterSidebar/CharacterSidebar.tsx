'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { CharacterDoc, RelationshipFlow, RelationshipFlowEdge } from '@/characters/types';
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
  graph,
  onGraphChange,
  className,
}: CharacterSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('characters');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [edgeLabel, setEdgeLabel] = useState('');
  const [edgeWhy, setEdgeWhy] = useState('');

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

  const edges = useMemo(() => graph?.edges ?? [], [graph]);

  const getCharacterName = (characterId: string): string =>
    characters.find((c) => c.id === characterId)?.name ?? 'Unknown';

  const filteredEdges = useMemo(() => {
    if (!searchQuery.trim()) return edges;
    const query = searchQuery.toLowerCase();
    return edges.filter((edge) => {
      const sourceName = getCharacterName(edge.source).toLowerCase();
      const targetName = getCharacterName(edge.target).toLowerCase();
      const label = edge.data?.label?.toLowerCase() ?? '';
      const why = edge.data?.why?.toLowerCase() ?? '';
      return (
        sourceName.includes(query) ||
        targetName.includes(query) ||
        label.includes(query) ||
        why.includes(query)
      );
    });
  }, [edges, searchQuery, characters]);

  const handleDragStart = (e: React.DragEvent, characterId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/character', characterId);
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '0.5';
  };
  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '1';
  };

  const handleEditEdge = (edge: RelationshipFlowEdge) => {
    setEditingEdgeId(edge.id);
    setEdgeLabel(edge.data?.label ?? '');
    setEdgeWhy(edge.data?.why ?? '');
  };
  const handleSaveEdge = () => {
    if (!editingEdgeId || !graph || !onGraphChange) return;
    const updatedEdges = graph.edges.map((edge) =>
      edge.id === editingEdgeId
        ? {
            ...edge,
            data: {
              ...edge.data,
              label: edgeLabel.trim() || undefined,
              why: edgeWhy.trim() || undefined,
            },
          }
        : edge
    );
    onGraphChange({ ...graph, edges: updatedEdges });
    setEditingEdgeId(null);
    setEdgeLabel('');
    setEdgeWhy('');
  };
  const handleCancelEdge = () => {
    setEditingEdgeId(null);
    setEdgeLabel('');
    setEdgeWhy('');
  };
  const handleDeleteEdge = (edgeId: string) => {
    if (!graph || !onGraphChange) return;
    onGraphChange({ ...graph, edges: graph.edges.filter((e) => e.id !== edgeId) });
  };

  return (
    <div className={cn('h-full w-full flex flex-col bg-background border-l border-border', className)}>
      <CharacterSidebarTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        characterCount={characters.length}
        edgeCount={edges.length}
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
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          </div>
        </div>
      )}
      {activeTab === 'relationships' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto h-full">
            <RelationshipsList
              activeCharacterId={activeCharacterId}
              edges={edges}
              filteredEdges={filteredEdges}
              searchQuery={searchQuery}
              editingEdgeId={editingEdgeId}
              edgeLabel={edgeLabel}
              edgeWhy={edgeWhy}
              getCharacterName={getCharacterName}
              onEditEdge={handleEditEdge}
              onSaveEdge={handleSaveEdge}
              onCancelEdge={handleCancelEdge}
              onDeleteEdge={handleDeleteEdge}
              onEdgeLabelChange={setEdgeLabel}
              onEdgeWhyChange={setEdgeWhy}
            />
          </div>
        </div>
      )}
    </div>
  );
}
