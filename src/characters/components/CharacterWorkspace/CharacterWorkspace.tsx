'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { CharacterWorkspaceAdapter, ProjectInfo, CharacterDoc, RelationshipFlow } from '@magicborn/dialogue-forge/src/characters/types';
import { useDebouncedAutosave } from './hooks/useDebouncedAutosave';
import { DEFAULT_EDITOR_CONFIG } from './config/editor-config';
import { CharacterWorkspaceHeader } from './components/CharacterWorkspaceHeader';
import { CharacterWorkspaceModals } from './components/CharacterWorkspaceModals';
import { GraphDebugDrawer } from './components/GraphDebugDrawer';
import { RelationshipGraphEditor, type RelationshipGraphEditorRef } from './components/RelationshipGraphEditor';
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
  const graphEditorRef = useRef<RelationshipGraphEditorRef>(null);

  const isDebugDrawerOpen = useCharacterWorkspaceStore((s) => s.isDebugDrawerOpen);

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
        <CharacterWorkspaceHeader
          projects={projects}
          isLoadingProjects={isLoadingProjects}
          selectedProject={selectedProject}
          activeProjectId={activeProjectId}
          onProjectSelect={handleProjectSelect}
          onCreateCharacterClick={() => actions.openCreateCharacterModal()}
          onDebugClick={() => actions.openDebugDrawer()}
        />
        <div className="flex-1 p-6">
          {/* Relationship Graph Editor */}
          <div className="border rounded-lg bg-white flex flex-col h-full">
            {/* Relationship Graph Editor - Always shown when project is selected */}
            {currentGraph && activeProjectId ? (
              <RelationshipGraphEditor
                ref={graphEditorRef}
                graph={currentGraph}
                activeCharacterId={activeCharacterId || ''}
                characters={characters}
                onGraphChange={handleGraphChange}
                onCharacterSelect={handleCharacterSelect}
                onCreateCharacter={() => actions.openCreateCharacterModal()}
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

        <CharacterWorkspaceModals dataAdapter={dataAdapter} />
        <GraphDebugDrawer
          open={isDebugDrawerOpen}
          onOpenChange={(open) => { if (!open) actions.closeDebugDrawer(); }}
          graphEditorRef={graphEditorRef}
          relationshipFlow={currentGraph}
        />
      </div>
    </>
  );
}
