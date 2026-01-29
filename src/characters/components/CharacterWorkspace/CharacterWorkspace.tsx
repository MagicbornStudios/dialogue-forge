'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { CharacterWorkspaceAdapter, ProjectInfo, CharacterDoc, RelationshipFlow } from '@magicborn/dialogue-forge/src/characters/types';
import { ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useDebouncedAutosave } from './hooks/useDebouncedAutosave';
import { DEFAULT_EDITOR_CONFIG } from './config/editor-config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { RelationshipGraphEditor } from './components/RelationshipGraphEditor';

/**
 * Create default empty relationship flow
 */
function createDefaultRelationshipFlow(characterId: string): RelationshipFlow {
  return {
    nodes: [
      {
        id: characterId,
        type: 'character',
        position: { x: 400, y: 300 },
        data: { characterId },
      },
    ],
    edges: [],
  };
}

/**
 * Character workspace container component
 * Provides context for character relationship editing
 */
export function CharacterWorkspace({
  dataAdapter,
  selectedProjectId,
  onProjectChange,
}: {
  dataAdapter?: CharacterWorkspaceAdapter;
  selectedProjectId?: string | null;
  onProjectChange?: (projectId: string | null) => void;
}) {
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
  const [characters, setCharacters] = useState<CharacterDoc[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [currentGraph, setCurrentGraph] = useState<RelationshipFlow | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const lastLoadedCharacterIdRef = useRef<string | null>(null);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [newCharacterDescription, setNewCharacterDescription] = useState('');
  const [newCharacterImageUrl, setNewCharacterImageUrl] = useState('');

  // Load projects when adapter is available
  useEffect(() => {
    if (!dataAdapter) return;
    
    setIsLoadingProjects(true);
    dataAdapter.listProjects()
      .then(setProjects)
      .catch((err) => {
        console.error('Failed to load projects:', err);
      })
      .finally(() => setIsLoadingProjects(false));
  }, [dataAdapter]);

  // Load characters when project is selected
  useEffect(() => {
    if (!dataAdapter || !selectedProjectId) {
      setCharacters([]);
      return;
    }
    
    setIsLoadingCharacters(true);
    dataAdapter.listCharacters(selectedProjectId)
      .then(setCharacters)
      .catch((err) => {
        console.error('Failed to load characters:', err);
        setCharacters([]);
      })
      .finally(() => setIsLoadingCharacters(false));
  }, [dataAdapter, selectedProjectId]);

  // Create blank graph when project is selected or character changes
  // Only reset graph when activeCharacterId or selectedProjectId changes, not when characters array updates
  useEffect(() => {
    if (!selectedProjectId) {
      setCurrentGraph(null);
      lastLoadedCharacterIdRef.current = null;
      return;
    }

    // If no character is selected, show blank graph
    if (!activeCharacterId) {
      setCurrentGraph({
        nodes: [],
        edges: [],
      });
      lastLoadedCharacterIdRef.current = null;
      return;
    }

    // Only load graph if this is a new character selection (not just characters array update)
    if (lastLoadedCharacterIdRef.current === activeCharacterId) {
      return; // Already loaded this character's graph, don't overwrite local edits
    }

    // Load character's graph when selected
    const character = characters.find(c => c.id === activeCharacterId);
    if (character) {
      // Use character's relationshipFlow or create default
      let graph = character.relationshipFlow || createDefaultRelationshipFlow(activeCharacterId);
      
      // Ensure the active character node exists in the graph
      if (!graph.nodes.some(n => n.id === activeCharacterId)) {
        graph = {
          ...graph,
          nodes: [
            {
              id: activeCharacterId,
              type: 'character',
              position: { x: 400, y: 300 },
              data: { characterId: activeCharacterId },
            },
            ...graph.nodes,
          ],
        };
      }
      
      setCurrentGraph(graph);
      lastLoadedCharacterIdRef.current = activeCharacterId;
    } else {
      // Character not found, use default
      setCurrentGraph(createDefaultRelationshipFlow(activeCharacterId));
      lastLoadedCharacterIdRef.current = activeCharacterId;
    }
  }, [selectedProjectId, activeCharacterId, characters]); // Keep characters for initial load, but use ref to prevent overwrites

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const activeCharacter = characters.find(c => c.id === activeCharacterId);
  const relationshipCount = currentGraph?.edges.length || 0;

  // Debounced autosave
  useDebouncedAutosave(
    currentGraph,
    activeCharacterId,
    dataAdapter,
    DEFAULT_EDITOR_CONFIG,
    () => {
      // Update local character data after successful save
      if (activeCharacterId && currentGraph) {
        setCharacters(prev => prev.map(char => 
          char.id === activeCharacterId 
            ? { ...char, relationshipFlow: currentGraph }
            : char
        ));
      }
    }
  );

  const handleProjectSelect = (project: ProjectInfo) => {
    onProjectChange?.(project.id);
    setActiveCharacterId(null); // Clear selection when project changes
  };

  const handleCharacterSelect = (characterId: string) => {
    setActiveCharacterId(characterId);
  };

  const handleSave = async () => {
    if (!dataAdapter || !activeCharacterId || !currentGraph) return;

    setIsSaving(true);
    try {
      await dataAdapter.updateCharacter(activeCharacterId, {
        relationshipFlow: currentGraph,
      });
      // Update local character data
      setCharacters(prev => prev.map(char => 
        char.id === activeCharacterId 
          ? { ...char, relationshipFlow: currentGraph }
          : char
      ));
    } catch (err) {
      console.error('Failed to save character:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCharacter = async () => {
    if (!dataAdapter || !selectedProjectId || !newCharacterName.trim()) return;

    setIsCreating(true);
    try {
      const newCharacter = await dataAdapter.createCharacter(selectedProjectId, {
        name: newCharacterName.trim(),
        description: newCharacterDescription.trim() || undefined,
        imageUrl: newCharacterImageUrl.trim() || undefined,
      });
      
      // Add to local characters list
      setCharacters(prev => [...prev, newCharacter]);
      
      // Select the new character
      setActiveCharacterId(newCharacter.id);
      
      // Reset form and close dialog
      setNewCharacterName('');
      setNewCharacterDescription('');
      setNewCharacterImageUrl('');
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error('Failed to create character:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-background/80 px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Project Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={isLoadingProjects}>
                <span className="truncate max-w-[120px]">
                  {isLoadingProjects ? 'Loading...' : selectedProject ? selectedProject.title : 'No project'}
                </span>
                <ChevronDown className="ml-1.5 h-3 w-3 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px]">
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className={selectedProjectId === project.id ? 'bg-accent' : ''}
                >
                  {project.title}
                </DropdownMenuItem>
              ))}
              {projects.length === 0 && !isLoadingProjects && (
                <DropdownMenuItem disabled>No projects found</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create Character Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsCreateDialogOpen(true)}
            disabled={!selectedProjectId}
            title="Create new character"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Character/Relationship Count */}
          <div className="text-sm text-muted-foreground">
            {characters.length} characters · {relationshipCount} relationships
          </div>

          {/* Admin and API Buttons */}
          <div className="flex items-center gap-2 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('/admin', '_blank')}
              title="Open Payload Admin"
            >
              Admin
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('/api/graphql-playground', '_blank')}
              title="Open GraphQL Playground (API Documentation)"
            >
              API
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-6">
        {/* Relationship Graph Editor */}
        <div className="border rounded-lg bg-white flex flex-col h-full">
            {/* JointJS Graph Editor - Always shown when project is selected */}
            {currentGraph && selectedProjectId ? (
              <RelationshipGraphEditor
                graph={currentGraph}
                activeCharacterId={activeCharacterId || ''}
                characters={characters}
                onGraphChange={setCurrentGraph}
                onCharacterSelect={handleCharacterSelect}
                onCharacterUpdate={async (characterId, updates) => {
                  if (!dataAdapter) return;
                  try {
                    const updated = await dataAdapter.updateCharacter(characterId, updates);
                    setCharacters(prev => prev.map(c => c.id === characterId ? updated : c));
                  } catch (error) {
                    console.error('Failed to update character:', error);
                    throw error;
                  }
                }}
                dataAdapter={dataAdapter}
              />
            ) : (
              <div className="flex-1 border-2 border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-lg mb-2">🎭</div>
                  <div>Select a project to begin</div>
                </div>
              </div>
            )}
          </div>
      </div>

      {/* Create Character Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Character</DialogTitle>
            <DialogDescription>
              Add a new character to the project. You can edit relationships after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newCharacterName}
                onChange={(e) => setNewCharacterName(e.target.value)}
                placeholder="Character name"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newCharacterDescription}
                onChange={(e) => setNewCharacterDescription(e.target.value)}
                placeholder="Character description (optional)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={newCharacterImageUrl}
                onChange={(e) => setNewCharacterImageUrl(e.target.value)}
                placeholder="https://example.com/character.jpg (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewCharacterName('');
                setNewCharacterDescription('');
                setNewCharacterImageUrl('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCharacter}
              disabled={!newCharacterName.trim() || isCreating || !selectedProjectId}
            >
              {isCreating ? 'Creating...' : 'Create Character'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}