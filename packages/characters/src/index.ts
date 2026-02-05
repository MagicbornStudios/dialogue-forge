/**
 * Character workspace domain exports
 */

// Types
export * from './types'

// Data context (host provides value)
export {
  CharacterDataContext,
  useCharacterDataContext,
} from './components/CharacterWorkspace/CharacterDataContext'

// Store
export {
  createCharacterWorkspaceStore,
  CharacterWorkspaceStoreProvider,
  useCharacterWorkspaceStore,
  useCharacterWorkspaceStoreInstance,
  type CharacterWorkspaceStore,
  type CharacterWorkspaceState,
  type CreateCharacterWorkspaceStoreOptions,
  type LoadCharactersCallback,
} from './components/CharacterWorkspace/store/character-workspace-store'

export { setupCharacterWorkspaceSubscriptions } from './components/CharacterWorkspace/store/slices/subscriptions'
