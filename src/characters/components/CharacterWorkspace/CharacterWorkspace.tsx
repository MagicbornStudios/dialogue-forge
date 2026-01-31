'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Users } from 'lucide-react';
import type { CharacterWorkspaceAdapter, ProjectInfo, CharacterDoc, JointGraphJson } from '@magicborn/dialogue-forge/src/characters/types';
import { CharacterWorkspaceHeader } from './components/CharacterWorkspaceHeader';
import { CharacterWorkspaceModals } from './components/CharacterWorkspaceModals';
import { GraphDebugDrawer } from './components/GraphDebugDrawer';
import { RelationshipGraphEditor, type RelationshipGraphEditorRef } from './components/RelationshipGraphEditor';
import { RelationshipGraphEditorBlank } from './components/RelationshipGraphEditorBlank';

/** Set to true to render paper + one circle only (no app data, no drag-and-drop). */
const USE_BLANK_GRAPH_EDITOR = true;
import { ActiveCharacterPanel } from './components/ActiveCharacterPanel';
import { CharacterSidebar } from './components/CharacterSidebar';
import { CharacterDetailsPanel } from './components/CharacterDetailsPanel';
import { RelationshipLabelDialog } from './components/RelationshipLabelDialog';
import { useCharacterWorkspaceStore } from './store/character-workspace-store';
import { ProjectSync } from './components/ProjectSync';
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
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  // Local UI state
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const graphEditorRef = useRef<RelationshipGraphEditorRef>(null);

  // Graph UI: selection, edge edit dialog, context menu (owned here for 3-column layout)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [contextMenuNodeId, setContextMenuNodeId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

  const isDebugDrawerOpen = useCharacterWorkspaceStore((s) => s.isDebugDrawerOpen);

  const activeCharacter = useMemo(() => {
    if (!activeCharacterId) return null;
    return charactersById[activeCharacterId] ?? null;
  }, [activeCharacterId, charactersById]);

  const selectedCharacter = useMemo(() => {
    if (!selectedNodeId) return null;
    return charactersById[selectedNodeId] ?? null;
  }, [selectedNodeId, charactersById]);

  // Update store adapter when it changes
  useEffect(() => {
    if (dataAdapter) {
      // Store doesn't have a direct setter for adapter, but we can update it via store instance
      // For now, we'll handle adapter in effects below
    }
  }, [dataAdapter]);

  // Sync selectedProjectId to store
  useEffect(() => {
    const projectId = selectedProjectId ?? null;
    if (projectId !== activeProjectId) {
      actions.setActiveProjectId(projectId);
      if (!activeCharacterId && selectedProjectId) {
        setCurrentGraphJson(null);
      }
    }
  }, [selectedProjectId, activeProjectId, activeCharacterId, actions]);

  // Load projects when adapter is available (actionsRef avoids effect churn from actions dependency)
  useEffect(() => {
    if (!dataAdapter) {
      setIsLoadingProjects(false);
      return;
    }
    let cancelled = false;
    setIsLoadingProjects(true);
    dataAdapter
      .listProjects()
      .then((list: ProjectInfo[]) => {
        if (!cancelled) actionsRef.current.setProjects(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) console.error('Failed to load projects:', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProjects(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dataAdapter]);

  // Load characters when project is selected
  useEffect(() => {
    if (!dataAdapter || !activeProjectId) {
      actionsRef.current.setCharacters([]);
      setCurrentGraphJson(null);
      return;
    }
    if (!activeCharacterId) {
      setCurrentGraphJson(null);
    }
    let cancelled = false;
    setIsLoadingCharacters(true);
    dataAdapter
      .listCharacters(activeProjectId)
      .then((list: CharacterDoc[]) => {
        if (!cancelled) actionsRef.current.setCharacters(list);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.error('Failed to load characters:', err);
          actionsRef.current.setCharacters([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCharacters(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dataAdapter, activeProjectId, activeCharacterId]);

  // Current JointJS graph snapshot (loaded from character.relationshipGraphJson; save via Save button)
  const [currentGraphJson, setCurrentGraphJson] = useState<JointGraphJson | null>(null);
  const lastLoadedCharacterIdRef = useRef<string | null>(null);

  // When active character changes: load that character's saved JointJS graph (relationshipGraphJson).
  useEffect(() => {
    if (!activeCharacterId) {
      lastLoadedCharacterIdRef.current = null;
      setCurrentGraphJson(null);
      return;
    }
    if (lastLoadedCharacterIdRef.current === activeCharacterId) {
      return;
    }
    lastLoadedCharacterIdRef.current = activeCharacterId;
    const character = charactersById[activeCharacterId];
    const saved = character?.relationshipGraphJson;
    setCurrentGraphJson(saved && typeof saved === 'object' ? { ...saved } : null);
  }, [activeCharacterId, charactersById]);

  const characters = useMemo(() => Object.values(charactersById), [charactersById]);

  const handleSaveGraph = async () => {
    if (!activeCharacterId || !dataAdapter) return;
    const json = graphEditorRef.current?.getJointGraphJson();
    if (json == null) return;
    try {
      const updated = await dataAdapter.updateCharacter(activeCharacterId, {
        relationshipGraphJson: json as JointGraphJson,
      });
      actions.upsertCharacter(updated);
      setCurrentGraphJson(json as JointGraphJson);
    } catch (err) {
      console.error('Failed to save graph:', err);
    }
  };

  const handleProjectSelect = (project: ProjectInfo) => {
    onProjectChange?.(project.id);
    actions.setActiveProjectId(project.id);
    actions.setActiveCharacterId(null); // Clear selection when project changes
  };

  const handleCreateProject = dataAdapter?.createProject
    ? async (data: { name: string; description?: string }): Promise<ProjectInfo> => {
        const newProject = await dataAdapter.createProject({ name: data.name });
        const list = await dataAdapter.listProjects();
        actionsRef.current.setProjects(list);
        actions.setActiveProjectId(newProject.id);
        actions.setActiveCharacterId(null);
        onProjectChange?.(newProject.id);
        return newProject;
      }
    : undefined;

  const handleCharacterSelect = (characterId: string) => {
    actions.setActiveCharacterId(characterId);
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

  // Close context menu when clicking outside
  useEffect(() => {
    if (!contextMenuNodeId) return;
    const handleClick = () => {
      setContextMenuNodeId(null);
      setContextMenuPosition(null);
    };
    const t = setTimeout(() => document.addEventListener('click', handleClick), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', handleClick);
    };
  }, [contextMenuNodeId]);

  return (
    <>
      <ProjectSync selectedProjectId={selectedProjectId} />
      <div className="h-screen w-full flex flex-col">
        <CharacterWorkspaceHeader
          projects={projects}
          isLoadingProjects={isLoadingProjects}
          activeProjectId={activeProjectId}
          onProjectSelect={handleProjectSelect}
          onCreateProject={handleCreateProject}
          onCreateCharacterClick={() => actions.openCreateCharacterModal()}
          onDebugClick={() => actions.openDebugDrawer()}
          onSaveGraph={activeCharacterId ? handleSaveGraph : undefined}
        />
        <div className="flex-1 flex flex-col min-h-0 p-6">
          <div className="flex-1 flex min-h-0 border rounded-lg bg-white overflow-hidden">
            {/* Left: Active Character panel */}
            <aside className="w-64 flex-shrink-0 border-r border-border overflow-auto bg-background">
              <ActiveCharacterPanel
                character={activeCharacter}
                onUpdate={
                  activeCharacterId && handleCharacterUpdate
                    ? (updates) => handleCharacterUpdate(activeCharacterId, updates)
                    : undefined
                }
                dataAdapter={dataAdapter}
              />
            </aside>

            {/* Center: Graph editor only */}
            <main className="flex-1 min-w-0 flex flex-col">
              {activeProjectId ? (
                USE_BLANK_GRAPH_EDITOR ? (
                  <RelationshipGraphEditorBlank
                    ref={graphEditorRef}
                    graph={{ nodes: [], edges: [] }}
                    activeCharacterId={activeCharacterId || ''}
                    characters={characters}
                    selectedNodeId={selectedNodeId}
                    initialGraphJson={currentGraphJson}
                    onGraphChange={() => {}}
                    onNodeSelect={setSelectedNodeId}
                    onEdgeClick={(edgeId) => {
                      setEditingEdgeId(edgeId);
                      setLabelDialogOpen(true);
                    }}
                    onNodeContextMenu={(nodeId, position) => {
                      setContextMenuNodeId(nodeId);
                      setContextMenuPosition(position);
                    }}
                    onCharacterSelect={handleCharacterSelect}
                    onCreateCharacter={() => actions.openCreateCharacterModal()}
                    onCharacterUpdate={handleCharacterUpdate}
                    dataAdapter={dataAdapter}
                  />
                ) : (
                  <RelationshipGraphEditor
                    ref={graphEditorRef}
                    graph={{ nodes: [], edges: [] }}
                    activeCharacterId={activeCharacterId || ''}
                    characters={characters}
                    selectedNodeId={selectedNodeId}
                    onGraphChange={() => {}}
                    onNodeSelect={setSelectedNodeId}
                    onEdgeClick={(edgeId) => {
                      setEditingEdgeId(edgeId);
                      setLabelDialogOpen(true);
                    }}
                    onNodeContextMenu={(nodeId, position) => {
                      setContextMenuNodeId(nodeId);
                      setContextMenuPosition(position);
                    }}
                    onCharacterSelect={handleCharacterSelect}
                    onCreateCharacter={() => actions.openCreateCharacterModal()}
                    onCharacterUpdate={handleCharacterUpdate}
                    dataAdapter={dataAdapter}
                  />
                )
              ) : (
                <div className="flex-1 border-2 border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-lg mb-2">🎭</div>
                    <div>Select a project to begin</div>
                  </div>
                </div>
              )}
            </main>

            {/* Right: Character list + selected details */}
            <aside className="w-64 flex-shrink-0 border-l border-border flex flex-col bg-background overflow-hidden">
              <div className="flex-1 min-h-0 overflow-auto">
                <CharacterSidebar
                  characters={characters}
                  activeCharacterId={activeCharacterId}
                  onCharacterSelect={handleCharacterSelect}
                  onCreateCharacter={() => actions.openCreateCharacterModal()}
                  graph={{ nodes: [], edges: [] }}
                  onGraphChange={() => {}}
                  className="h-full"
                />
              </div>
              {selectedCharacter && (
                <div className="border-t border-border flex-shrink-0" style={{ maxHeight: '300px' }}>
                  <CharacterDetailsPanel
                    character={selectedCharacter}
                    isActiveCharacter={selectedNodeId === activeCharacterId}
                    className="h-auto"
                  />
                </div>
              )}
            </aside>
          </div>
        </div>

        <RelationshipLabelDialog
          open={labelDialogOpen}
          onOpenChange={setLabelDialogOpen}
          currentLabel=""
          currentWhy=""
          onConfirm={() => {
            setEditingEdgeId(null);
            setLabelDialogOpen(false);
          }}
        />

        {contextMenuNodeId != null && contextMenuPosition != null && typeof window !== 'undefined' &&
          createPortal(
            <div
              className="fixed z-50 bg-popover border border-border rounded-md shadow-md min-w-[180px] py-1"
              style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="flex w-full items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent transition-colors text-left"
                onClick={() => {
                  handleCharacterSelect(contextMenuNodeId);
                  setContextMenuNodeId(null);
                  setContextMenuPosition(null);
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                Load as Active Character
              </button>
            </div>,
            document.body
          )}

        <CharacterWorkspaceModals dataAdapter={dataAdapter} />
        <GraphDebugDrawer
          open={isDebugDrawerOpen}
          onOpenChange={(open) => { if (!open) actions.closeDebugDrawer(); }}
          graphEditorRef={graphEditorRef}
          relationshipFlow={null}
        />
      </div>
    </>
  );
}
