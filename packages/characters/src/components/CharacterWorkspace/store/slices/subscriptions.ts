import type { CharacterWorkspaceStore } from '../character-workspace-store';
import type { LoadCharactersCallback } from '../character-workspace-store';

/**
 * Setup subscriptions for side-effect events.
 * When activeProjectId changes, calls loadCharacters(projectId) and syncs result into store.
 */
export function setupCharacterWorkspaceSubscriptions(
  store: CharacterWorkspaceStore,
  loadCharacters?: LoadCharactersCallback
) {
  if (!loadCharacters) return;

  let previousProjectId: string | null = null;

  store.subscribe(() => {
    const activeProjectId = store.getState().activeProjectId;
    if (activeProjectId === previousProjectId) return;
    previousProjectId = activeProjectId;

    if (!activeProjectId) {
      store.getState().actions.setCharacters([]);
      return;
    }

    loadCharacters(activeProjectId)
      .then((characters) => store.getState().actions.setCharacters(characters))
      .catch((err) => {
        console.error('Failed to load characters:', err);
        store.getState().actions.setCharacters([]);
      });
  });
}
