import { useEffect, useRef } from 'react';
import type { CharacterDoc, JointGraphJson } from '@/characters/types';
import type { CharacterWorkspaceAdapter } from '@/characters/types';

export interface CharacterGraphEditorConfig {
  autosaveEnabled: boolean;
  autosaveDebounceMs: number;
}

/**
 * Hook for debounced autosave of graph changes
 */
export function useDebouncedAutosave(
    graph: JointGraphJson | null,
  characterId: string | null,
  dataAdapter: CharacterWorkspaceAdapter | undefined,
  config: CharacterGraphEditorConfig,
  onSaveComplete?: (savedCharacter: CharacterDoc) => void
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedGraphRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);
  const characterIdRef = useRef(characterId);
  const dataAdapterRef = useRef(dataAdapter);
  const onSaveCompleteRef = useRef(onSaveComplete);

  // Keep refs in sync
  useEffect(() => {
    characterIdRef.current = characterId;
    dataAdapterRef.current = dataAdapter;
    onSaveCompleteRef.current = onSaveComplete;
  }, [characterId, dataAdapter, onSaveComplete]);

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
        const saved = await currentAdapter.updateCharacter(currentCharacterId, {
          relationshipGraphJson: graphToSave,
        });
        
        // Update last saved reference
        lastSavedGraphRef.current = serializedToSave;
        
        // Call completion callback with saved doc (use ref to avoid effect re-running and clearing timeout)
        onSaveCompleteRef.current?.(saved);
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
  }, [graph, characterId, dataAdapter, config.autosaveEnabled, config.autosaveDebounceMs]);

  // Reset last saved when character changes
  useEffect(() => {
    lastSavedGraphRef.current = null;
  }, [characterId]);
}
