'use client';

import React, { useRef } from 'react';
import { useCharacterWorkspaceStore, useCharacterWorkspaceStoreInstance } from '../CharacterWorkspace/store/character-workspace-store';
import { useJointRelationshipShell } from './hooks/useJointRelationshipShell';
import { CharacterSidebar } from './components/CharacterSidebar';
import { ActiveCharacterPanel } from './components/ActiveCharacterPanel';
import { CharacterDetailsPanel } from './components/CharacterDetailsPanel';
import type { CharacterWorkspaceAdapter } from '@/characters/types';

interface RelationshipGraphEditorProps {
  dataAdapter?: CharacterWorkspaceAdapter;
  onCharacterUpdate?: (characterId: string, updates: { name?: string; description?: string; imageUrl?: string }) => Promise<void>;
}

/**
 * JointJS-based relationship graph editor
 * Uses the bridge hook to sync between domain state and JointJS
 */
export function RelationshipGraphEditor({
  dataAdapter,
  onCharacterUpdate,
}: RelationshipGraphEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const store = useCharacterWorkspaceStoreInstance();

  // Get state from store
  const activeCharacterId = useCharacterWorkspaceStore((s) => s.activeCharacterId);
  const characters = useCharacterWorkspaceStore((s) => Object.values(s.charactersById));
  const selectedCharacterId = useCharacterWorkspaceStore((s) => s.selectedCharacterId);
  const setActiveCharacterId = useCharacterWorkspaceStore((s) => s.actions.setActiveCharacterId);
  const setActiveGraphFlow = useCharacterWorkspaceStore((s) => s.actions.setActiveGraphFlow);

  // Get active character and their graph
  const activeCharacter = activeCharacterId 
    ? characters.find((c) => c.id === activeCharacterId) 
    : null;

  const graph = activeCharacter?.relationshipFlow || { nodes: [], edges: [] };

  // Handle graph changes
  const handleGraphChange = (newGraph: typeof graph) => {
    if (activeCharacterId) {
      setActiveGraphFlow(newGraph);
      
      // Save to backend if adapter is available
      if (dataAdapter && activeCharacter) {
        dataAdapter.updateCharacter(activeCharacterId, {
          relationshipFlow: newGraph,
        }).catch((error) => {
          console.error('Failed to save relationship graph:', error);
        });
      }
    }
  };

  // Initialize JointJS shell
  useJointRelationshipShell({
    containerRef,
    store,
    activeCharacterId: activeCharacterId || '',
    characters,
    graph,
    onGraphChange: handleGraphChange,
  });

  // Get selected character info
  const selectedCharacter = selectedCharacterId
    ? characters.find((c) => c.id === selectedCharacterId)
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 min-h-0">
        {/* Active Character Panel - Left side (editable) */}
        <ActiveCharacterPanel
          character={activeCharacter}
          onUpdate={
            onCharacterUpdate && activeCharacterId
              ? (updates) => onCharacterUpdate(activeCharacterId, updates)
              : undefined
          }
          dataAdapter={dataAdapter}
        />

        {/* JointJS Graph Container */}
        <div className="flex-1 relative">
          <div
            ref={containerRef}
            className="absolute inset-0"
            style={{
              backgroundColor: '#ffffff',
            }}
          />

          {/* Instructions overlay */}
          {!activeCharacterId ? (
            <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-md shadow-md text-sm max-w-xs z-20 pointer-events-none">
              <div className="font-semibold mb-2">Getting Started</div>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• Select a character from the sidebar to edit their relationships</li>
                <li>• Drag characters from the sidebar onto the canvas</li>
                <li>• Click and drag from the active character (green) to create relationships</li>
              </ul>
            </div>
          ) : graph.nodes.length === 0 || (graph.nodes.length === 1 && graph.edges.length === 0) ? (
            <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-md shadow-md text-sm max-w-xs z-20 pointer-events-none">
              <div className="font-semibold mb-2">Add Characters</div>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• Drag characters from the sidebar to add them to the graph</li>
                <li>• Click and drag from {activeCharacter?.name} (green node) to create relationships</li>
                <li>• Click on relationship lines to edit labels</li>
                <li>• Drag nodes to reposition them</li>
              </ul>
            </div>
          ) : null}
        </div>

        {/* Right Side Panel Container */}
        <div className="w-64 h-full flex flex-col bg-background border-l border-border">
          {/* Character Sidebar */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <CharacterSidebar
              characters={characters}
              activeCharacterId={activeCharacterId || ''}
              onCharacterSelect={(characterId) => setActiveCharacterId(characterId)}
              charactersInGraph={graph.nodes.map((n) => n.id)}
              graph={graph}
              onGraphChange={handleGraphChange}
              className="h-full"
            />
          </div>

          {/* Selected Character Details Panel - Below sidebar */}
          {selectedCharacter && (
            <div
              className="border-t border-border flex-shrink-0 overflow-auto"
              style={{ maxHeight: '300px' }}
            >
              <CharacterDetailsPanel
                character={selectedCharacter}
                isActiveCharacter={selectedCharacterId === activeCharacterId}
                className="h-auto"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
