'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { useCharacterWorkspaceStore } from './store/character-workspace-store';
import { ProjectSync } from './components/ProjectSync';

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
 * Uses Zustand store for state management
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
  // Store selectors
  const projects = useCharacterWorkspaceStore((s) => s.projects);
  const activeProjectId = useCharacterWorkspaceStore((s) => s.activeProjectId);
  const charactersById = useCharacterWorkspaceStore((s) => s.charactersById);
  const activeCharacterId = useCharacterWorkspaceStore((s) => s.activeCharacterId);
  const actions = useCharacterWorkspaceStore((s) => s.actions);

  // Local UI state
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [newCharacterDescription, setNewCharacterDescription] = useState('');
  const [newCharacterImageUrl, setNewCharacterImageUrl] = useState('');

  // Update store adapter when it changes
  useEffect(() => {
    if (dataAdapter) {
      // Store doesn't have a direct setter for adapter, but we can update it via store instance
      // For now, we'll handle adapter in effects below
    }
  }, [dataAdapter]);

  // Sync selectedProjectId to store
  useEffect(() => {
    if (selectedProjectId !== activeProjectId) {
      actions.setActiveProjectId(selectedProjectId);
      // When project changes, show empty graph if no character selected
      if (!activeCharacterId && selectedProjectId) {
        setCurrentGraphState({ nodes: [], edges: [] });
      }
    }
  }, [selectedProjectId, activeProjectId, activeCharacterId, actions]);

  // Load projects when adapter is available
  useEffect(() => {
    if (!dataAdapter) return;
    
    setIsLoadingProjects(true);
    dataAdapter.listProjects()
      .then((projects) => {
        actions.setProjects(projects);
      })
      .catch((err) => {
        console.error('Failed to load projects:', err);
      })
      .finally(() => setIsLoadingProjects(false));
  }, [dataAdapter, actions]);

  // Load characters when project is selected
  useEffect(() => {
    if (!dataAdapter || !activeProjectId) {
      actions.setCharacters([]);
      setCurrentGraphState(null);
      return;
    }
    
    // Show empty graph when project is selected (even if no character selected yet)
    if (!activeCharacterId) {
      setCurrentGraphState({ nodes: [], edges: [] });
    }
    
    setIsLoadingCharacters(true);
    dataAdapter.listCharacters(activeProjectId)
      .then((characters) => {
        actions.setCharacters(characters);
      })
      .catch((err) => {
        console.error('Failed to load characters:', err);
        actions.setCharacters([]);
      })
      .finally(() => setIsLoadingCharacters(false));
  }, [dataAdapter, activeProjectId, activeCharacterId, actions]);

  // Track current graph state (can be empty when no character selected)
  const [currentGraphState, setCurrentGraphState] = useState<RelationshipFlow | null>(null);
  // Only load graph from store when user switches character; don't overwrite on charactersById/store updates
  const lastLoadedCharacterIdRef = useRef<string | null>(null);

  // Load graph only when active character *changes* (not when charactersById updates)
  useEffect(() => {
    if (!activeCharacterId) {
      lastLoadedCharacterIdRef.current = null;
      setCurrentGraphState({ nodes: [], edges: [] });
      return;
    }

    // Already loaded this character's graph - don't overwrite (user may have added nodes locally)
    if (lastLoadedCharacterIdRef.current === activeCharacterId) {
      return;
    }

    lastLoadedCharacterIdRef.current = activeCharacterId;
    const character = charactersById[activeCharacterId];
    if (!character) {
      setCurrentGraphState(createDefaultRelationshipFlow(activeCharacterId));
      return;
    }

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
    
    setCurrentGraphState(graph);
    actions.setActiveGraphFlow(graph);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Only load when activeCharacterId changes; charactersById changes (e.g. after graph edit) must not overwrite local graph
  }, [activeCharacterId]);

  // Get current graph (use local state, fallback to active character's graph)
  const currentGraph = useMemo(() => {
    if (currentGraphState) return currentGraphState;
    if (!activeCharacterId) return null;
    const character = charactersById[activeCharacterId];
    return character?.relationshipFlow || null;
  }, [currentGraphState, activeCharacterId, charactersById]);

  // Get characters array for components
  const characters = useMemo(() => Object.values(charactersById), [charactersById]);
  
  const selectedProject = projects.find(p => p.id === activeProjectId);
  const relationshipCount = currentGraph?.edges.length || 0;

  // Debounced autosave
  useDebouncedAutosave(
    currentGraph,
    activeCharacterId,
    dataAdapter,
    DEFAULT_EDITOR_CONFIG,
    (savedCharacter) => {
      // Update store with saved character (hook already saved to API)
      actions.upsertCharacter(savedCharacter);
    }
  );

  const handleProjectSelect = (project: ProjectInfo) => {
    onProjectChange?.(project.id);
    actions.setActiveProjectId(project.id);
    actions.setActiveCharacterId(null); // Clear selection when project changes
  };

  const handleCharacterSelect = (characterId: string) => {
    actions.setActiveCharacterId(characterId);
  };

  const handleCreateCharacter = async () => {
    if (!dataAdapter || !activeProjectId || !newCharacterName.trim()) return;

    setIsCreating(true);
    try {
      const newCharacter = await dataAdapter.createCharacter(activeProjectId, {
        name: newCharacterName.trim(),
        description: newCharacterDescription.trim() || undefined,
        imageUrl: newCharacterImageUrl.trim() || undefined,
      });
      
      // Add to store
      actions.upsertCharacter(newCharacter);
      
      // Select the new character
      actions.setActiveCharacterId(newCharacter.id);
      
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

  const handleGraphChange = (graph: RelationshipFlow) => {
    // Update local state immediately for UI responsiveness
    setCurrentGraphState(graph);
    // Update store if we have an active character
    if (activeCharacterId) {
      actions.setActiveGraphFlow(graph);
    }
  };

  const handleCharacterUpdate = async (characterId: string, updates: { name?: string; description?: string; imageUrl?: string; avatarId?: string | null }) => {
    if (!dataAdapter) return;
    try {
      const updated = await dataAdapter.updateCharacter(characterId, updates);
      actions.upsertCharacter(updated);
    } catch (error) {
      console.error('Failed to update character:', error);
      throw error;
    }
  };

  return (
    <>
      <ProjectSync selectedProjectId={selectedProjectId} />
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
                    className={activeProjectId === project.id ? 'bg-accent' : ''}
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
              disabled={!activeProjectId}
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
            {/* Relationship Graph Editor - Always shown when project is selected */}
            {currentGraph && activeProjectId ? (
              <RelationshipGraphEditor
                graph={currentGraph}
                activeCharacterId={activeCharacterId || ''}
                characters={characters}
                onGraphChange={handleGraphChange}
                onCharacterSelect={handleCharacterSelect}
                onCreateCharacter={() => setIsCreateDialogOpen(true)}
                onCharacterUpdate={handleCharacterUpdate}
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
                disabled={!newCharacterName.trim() || isCreating || !activeProjectId}
              >
                {isCreating ? 'Creating...' : 'Create Character'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
