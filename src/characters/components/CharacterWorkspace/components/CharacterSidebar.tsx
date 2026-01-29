'use client';

import React, { useState, useMemo } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';
import { Users, Edit, Link2 } from 'lucide-react';
import { SearchInput } from '@/shared/ui/SearchInput';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Button } from '@/shared/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import type { CharacterDoc, RelationshipFlow, RelationshipFlowEdge } from '@/characters/types';
import { cn } from '@/shared/lib/utils';

interface CharacterSidebarProps {
  characters: CharacterDoc[];
  activeCharacterId: string | null;
  onCharacterSelect?: (characterId: string) => void;
  charactersInGraph?: string[]; // Character IDs already in the graph
  graph?: RelationshipFlow | null; // Current graph with edges
  onGraphChange?: (graph: RelationshipFlow) => void; // Callback to update graph
  className?: string;
}

export function CharacterSidebar({
  characters,
  activeCharacterId,
  onCharacterSelect,
  charactersInGraph = [],
  graph,
  onGraphChange,
  className,
}: CharacterSidebarProps) {
  const [activeTab, setActiveTab] = useState<'characters' | 'relationships'>('characters');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [edgeLabel, setEdgeLabel] = useState('');
  const [edgeWhy, setEdgeWhy] = useState('');

  // Separate active character from others
  const activeCharacter = useMemo(() => {
    if (!activeCharacterId) return null;
    return characters.find(c => c.id === activeCharacterId) || null;
  }, [characters, activeCharacterId]);

  // Filter other characters (excluding active character and those already in graph)
  const otherCharacters = useMemo(() => {
    // Filter out active character and characters already in graph
    let filtered = characters.filter(
      char => char.id !== activeCharacterId && !charactersInGraph.includes(char.id)
    );
    
    // Then filter by search query
    if (!searchQuery.trim()) return filtered;
    
    const query = searchQuery.toLowerCase();
    return filtered.filter(char =>
      char.name.toLowerCase().includes(query) ||
      char.description?.toLowerCase().includes(query)
    );
  }, [characters, activeCharacterId, charactersInGraph, searchQuery]);

  const handleDragStart = (e: React.DragEvent, characterId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/character', characterId);
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  // Get character name by ID
  const getCharacterName = (characterId: string): string => {
    const char = characters.find(c => c.id === characterId);
    return char?.name || 'Unknown';
  };

  // Get edges for the current graph
  const edges = useMemo(() => {
    return graph?.edges || [];
  }, [graph]);

  // Filter edges by search query
  const filteredEdges = useMemo(() => {
    if (!searchQuery.trim()) return edges;
    const query = searchQuery.toLowerCase();
    return edges.filter(edge => {
      const sourceName = getCharacterName(edge.source).toLowerCase();
      const targetName = getCharacterName(edge.target).toLowerCase();
      const label = edge.data?.label?.toLowerCase() || '';
      const why = edge.data?.why?.toLowerCase() || '';
      return sourceName.includes(query) || targetName.includes(query) || label.includes(query) || why.includes(query);
    });
  }, [edges, searchQuery, characters]);

  // Handle edge edit
  const handleEditEdge = (edge: RelationshipFlowEdge) => {
    setEditingEdgeId(edge.id);
    setEdgeLabel(edge.data?.label || '');
    setEdgeWhy(edge.data?.why || '');
  };

  // Handle edge save
  const handleSaveEdge = () => {
    if (!editingEdgeId || !graph || !onGraphChange) return;

    const updatedEdges = graph.edges.map(edge => {
      if (edge.id === editingEdgeId) {
        return {
          ...edge,
          data: {
            ...edge.data,
            label: edgeLabel.trim() || undefined,
            why: edgeWhy.trim() || undefined,
          },
        };
      }
      return edge;
    });

    onGraphChange({
      ...graph,
      edges: updatedEdges,
    });

    setEditingEdgeId(null);
    setEdgeLabel('');
    setEdgeWhy('');
  };

  // Handle edge cancel
  const handleCancelEdge = () => {
    setEditingEdgeId(null);
    setEdgeLabel('');
    setEdgeWhy('');
  };

  // Handle edge delete
  const handleDeleteEdge = (edgeId: string) => {
    if (!graph || !onGraphChange) return;
    onGraphChange({
      ...graph,
      edges: graph.edges.filter(e => e.id !== edgeId),
    });
  };

  return (
    <div className={cn('h-full w-full flex flex-col bg-background border-l border-border', className)}>
      {/* Tab Group Header */}
      <ToggleGroup
        type="single"
        value={activeTab}
        onValueChange={(value) => {
          if (value) setActiveTab(value as 'characters' | 'relationships');
        }}
        variant="outline"
        className="w-full flex rounded-none bg-transparent h-8 px-0 gap-0 m-0 min-w-0 overflow-hidden border-b border-border relative group"
      >
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-[var(--editor-border-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        <ToggleGroupItem
          value="characters"
          aria-label="Characters"
          className={cn(
            "min-w-0 flex-1 text-xs rounded-none px-1 py-0.5 truncate leading-tight relative",
            "text-muted-foreground hover:text-foreground transition-colors",
            "data-[state=on]:bg-muted data-[state=on]:text-foreground",
            activeTab === 'characters' && "border-l-2 border-l-[var(--editor-info)]",
            activeTab !== 'characters' && "border-l-2 border-l-[var(--color-df-info-muted,theme(colors.blue.300))]/30"
          )}
        >
          <Users
            size={12}
            className={cn(
              "mr-0.5 shrink-0 transition-colors",
              activeTab === 'characters'
                ? "text-[var(--editor-info)]"
                : "text-[var(--color-df-info-muted,theme(colors.blue.300))]"
            )}
          />
          <span className="truncate">Characters</span>
          {characters.length > 0 && (
            <span className={cn(
              "ml-0.5 text-[9px] px-1 py-0.5 rounded shrink-0",
              "bg-[var(--editor-info)]/20 text-[var(--editor-info)]"
            )}>
              {characters.length}
            </span>
          )}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="relationships"
          aria-label="Relationships"
          className={cn(
            "min-w-0 flex-1 text-xs rounded-none px-1 py-0.5 truncate leading-tight relative",
            "text-muted-foreground hover:text-foreground transition-colors",
            "data-[state=on]:bg-muted data-[state=on]:text-foreground",
            activeTab === 'relationships' && "border-l-2 border-l-[var(--editor-info)]",
            activeTab !== 'relationships' && "border-l-2 border-l-[var(--color-df-info-muted,theme(colors.blue.300))]/30"
          )}
        >
          <Link2
            size={12}
            className={cn(
              "mr-0.5 shrink-0 transition-colors",
              activeTab === 'relationships'
                ? "text-[var(--editor-info)]"
                : "text-[var(--color-df-info-muted,theme(colors.blue.300))]"
            )}
          />
          <span className="truncate">Relationships</span>
          {edges.length > 0 && (
            <span className={cn(
              "ml-0.5 text-[9px] px-1 py-0.5 rounded shrink-0",
              "bg-[var(--editor-info)]/20 text-[var(--editor-info)]"
            )}>
              {edges.length}
            </span>
          )}
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Search */}
      <div className="px-2 py-2 border-b border-border">
        <SearchInput
          placeholder={activeTab === 'characters' ? 'Search characters...' : 'Search relationships...'}
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-full"
        />
      </div>

      {/* Character List */}
      {activeTab === 'characters' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto h-full">
            {characters.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                {searchQuery ? 'No characters found' : 'No characters'}
              </div>
            ) : (
              <div className="py-1">
                {/* Active Character - Always shown at top */}
                {activeCharacter && (
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div
                        className={cn(
                          "w-full px-2 py-1.5 text-left text-xs transition-colors duration-200 cursor-pointer",
                          'bg-muted text-foreground border-l-2 border-[var(--editor-border-active)]'
                        )}
                        onDoubleClick={() => onCharacterSelect?.(activeCharacter.id)}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Users size={12} className="shrink-0 text-[var(--editor-info)]" />
                          <span className="truncate font-medium">{activeCharacter.name}</span>
                        </div>
                        {activeCharacter.description && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 truncate pl-3.5">
                            {activeCharacter.description}
                          </div>
                        )}
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onSelect={() => onCharacterSelect?.(activeCharacter.id)}>
                        <Edit size={14} className="mr-2" />
                        Edit
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                )}

                {/* Other Characters */}
                {otherCharacters.length > 0 && (
                  <>
                    {activeCharacter && <div className="h-px bg-border my-1" />}
                    {otherCharacters.map((character) => {
                      return (
                        <ContextMenu key={character.id}>
                          <ContextMenuTrigger asChild>
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, character.id)}
                              onDragEnd={handleDragEnd}
                              onDoubleClick={() => onCharacterSelect?.(character.id)}
                              className={cn(
                                "w-full px-2 py-1.5 text-left text-xs transition-colors duration-200 cursor-grab active:cursor-grabbing",
                                'text-muted-foreground hover:bg-muted hover:text-foreground hover:border-l-2 hover:border-[var(--editor-border-hover)]'
                              )}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <Users size={12} className="shrink-0 text-muted-foreground" />
                                <span className="truncate font-medium">{character.name}</span>
                              </div>
                              {character.description && (
                                <div className="text-[10px] text-muted-foreground mt-0.5 truncate pl-3.5">
                                  {character.description}
                                </div>
                              )}
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem onSelect={() => onCharacterSelect?.(character.id)}>
                              <Edit size={14} className="mr-2" />
                              Edit
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      );
                    })}
                  </>
                )}

                {/* Empty state when no other characters match search */}
                {!activeCharacter && otherCharacters.length === 0 && (
                  <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                    {searchQuery ? 'No characters found' : 'No characters'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Relationships List */}
      {activeTab === 'relationships' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto h-full">
            {!activeCharacterId ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                Select a character to view relationships
              </div>
            ) : edges.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                {searchQuery ? 'No relationships found' : 'No relationships yet'}
              </div>
            ) : (
              <div className="py-1">
                {filteredEdges.map((edge) => {
                  const sourceName = getCharacterName(edge.source);
                  const targetName = getCharacterName(edge.target);
                  const isEditing = editingEdgeId === edge.id;

                  return (
                    <div
                      key={edge.id}
                      className={cn(
                        "w-full px-2 py-2 border-b border-border last:border-b-0",
                        isEditing && "bg-muted"
                      )}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="text-[10px] text-muted-foreground">
                            {sourceName} → {targetName}
                          </div>
                          <div className="space-y-1.5">
                            <Input
                              value={edgeLabel}
                              onChange={(e) => setEdgeLabel(e.target.value)}
                              placeholder="Relationship label"
                              className="h-7 text-xs"
                              autoFocus
                            />
                            <Textarea
                              value={edgeWhy}
                              onChange={(e) => setEdgeWhy(e.target.value)}
                              placeholder="Why this relationship exists..."
                              className="min-h-[60px] text-xs resize-none"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-6 text-xs px-2"
                              onClick={handleSaveEdge}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs px-2"
                              onClick={handleCancelEdge}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 text-xs px-2 ml-auto"
                              onClick={() => {
                                handleDeleteEdge(edge.id);
                                handleCancelEdge();
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="group cursor-pointer hover:bg-muted/50 rounded px-1 py-1 -mx-1 transition-colors"
                          onClick={() => handleEditEdge(edge)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] text-muted-foreground mb-0.5">
                                {sourceName} → {targetName}
                              </div>
                              {edge.data?.label ? (
                                <div className="text-xs font-medium truncate">
                                  {edge.data.label}
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground italic">
                                  No label
                                </div>
                              )}
                              {edge.data?.why && (
                                <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                                  {edge.data.why}
                                </div>
                              )}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEdge(edge);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
