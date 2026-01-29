import type { CharacterWorkspaceStore } from '../character-workspace-store';
import type { CharacterWorkspaceAdapter } from '@/characters/types';

/**
 * Setup subscriptions for side-effect events.
 * These subscriptions handle automatic behaviors like loading characters when project changes.
 */
export function setupCharacterWorkspaceSubscriptions(
  store: CharacterWorkspaceStore,
  dataAdapter?: CharacterWorkspaceAdapter
) {
  if (!dataAdapter) return;

  // Track previous project ID to only react to actual changes
  let previousProjectId: string | null = null;

  // Subscribe to state changes, but only process when activeProjectId actually changes
  store.subscribe(
    async (state, prevState) => {
      const activeProjectId = state.activeProjectId;
      
      // Only proceed if project ID actually changed
      if (activeProjectId === previousProjectId) return;
      previousProjectId = activeProjectId;
      
      if (!activeProjectId) {
        // Clear characters when no project selected
        store.getState().actions.setCharacters([]);
        return;
      }
      
      try {
        const characters = await dataAdapter.listCharacters(activeProjectId);
        store.getState().actions.setCharacters(characters);
      } catch (error) {
        console.error('Failed to load characters:', error);
        store.getState().actions.setCharacters([]);
      }
    }
  );
}
