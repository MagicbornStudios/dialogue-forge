import { useEffect, useRef } from 'react';
import type { RelationshipFlow } from '@/characters/types';
import type { CharacterWorkspaceAdapter } from '@/characters/types';
import type { CharacterGraphEditorConfig } from '../config/editor-config';

/**
 * Hook for debounced autosave of graph changes
 */
export function useDebouncedAutosave(
  graph: RelationshipFlow | null,
  characterId: string | null,
  dataAdapter: CharacterWorkspaceAdapter | undefined,
  config: CharacterGraphEditorConfig,
  onSaveComplete?: () => void
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedGraphRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);
  const characterIdRef = useRef(characterId);
  const dataAdapterRef = useRef(dataAdapter);

  // Keep refs in sync
  useEffect(() => {
    characterIdRef.current = characterId;
    dataAdapterRef.current = dataAdapter;
  }, [characterId, dataAdapter]);

  useEffect(() => {
    // Don't autosave if disabled, no graph, no character, or no adapter
    if (!config.autosaveEnabled || !graph || !characterId || !dataAdapter) {
      // Clear any pending save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Serialize graph for comparison
    const serialized = JSON.stringify(graph);
    
    // Skip if graph hasn't changed
    if (serialized === lastSavedGraphRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up debounced save - capture graph value at this point
    const graphToSave = graph;
    const serializedToSave = serialized;
    
    timeoutRef.current = setTimeout(async () => {
      const currentCharacterId = characterIdRef.current;
      const currentAdapter = dataAdapterRef.current;
      
      // Double-check conditions before saving
      if (!currentCharacterId || !currentAdapter || !graphToSave || isSavingRef.current) {
        return;
      }

      // Prevent concurrent saves
      isSavingRef.current = true;
      
      try {
        await currentAdapter.updateCharacter(currentCharacterId, {
          relationshipFlow: graphToSave,
        });
        
        // Update last saved reference
        lastSavedGraphRef.current = serializedToSave;
        
        // Call completion callback
        onSaveComplete?.();
      } catch (error) {
        console.error('Failed to autosave character graph:', error);
        // On error, don't update lastSavedGraphRef so it will retry on next change
      } finally {
        isSavingRef.current = false;
      }
    }, config.autosaveDebounceMs);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [graph, characterId, dataAdapter, config.autosaveEnabled, config.autosaveDebounceMs, onSaveComplete]);

  // Reset last saved when character changes
  useEffect(() => {
    lastSavedGraphRef.current = null;
  }, [characterId]);
}
