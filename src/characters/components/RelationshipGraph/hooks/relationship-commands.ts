/**
 * Relationship graph commands
 * These are the typed commands that OpenCode and UI components should use
 * to interact with the relationship graph
 */

import type { Position } from '@/characters/types'
import type { CharacterWorkspaceStore } from '../../CharacterWorkspace/store/character-workspace-store'

export interface RelationshipCommands {
  /**
   * Select a character as the active perspective
   */
  selectPerspective: (characterId: string) => void

  /**
   * Add a character node to the active graph
   */
  addCharacterNode: (targetCharacterId: string, position?: Position) => void

  /**
   * Move a node in the active graph
   */
  moveNode: (characterId: string, position: Position) => void

  /**
   * Remove a node from the active graph (never removes the perspective node)
   */
  removeNode: (characterId: string) => void

  /**
   * Create or update a relationship from the active character to another character
   */
  setRelationship: (targetId: string, label?: string) => void

  /**
   * Remove a relationship from the active character to another character
   */
  removeRelationship: (targetId: string) => void

  /**
   * Rename a character
   */
  renameCharacter: (id: string, name: string) => void

  /**
   * Set a character's image URL
   */
  setCharacterImageUrl: (id: string, url: string) => void

  /**
   * Set a character's description
   */
  setCharacterDescription: (id: string, text: string) => void

  /**
   * Auto-layout the graph (radial around POV)
   */
  autoLayout?: () => void
}

/**
 * Create relationship commands bound to a store instance
 */
export function createRelationshipCommands(store: CharacterWorkspaceStore): RelationshipCommands {
  return {
    selectPerspective: (characterId: string) => {
      store.getState().actions.setActiveCharacterId(characterId)
    },

    addCharacterNode: (targetCharacterId: string, position?: Position) => {
      const state = store.getState()
      const pos = position ?? { x: 400, y: 300 }
      
      // Add node to active graph
      state.actions.addNodeToActiveGraph(targetCharacterId, pos)
    },

    moveNode: (characterId: string, position: Position) => {
      store.getState().actions.moveNodeInActiveGraph(characterId, position)
    },

    removeNode: (characterId: string) => {
      const state = store.getState()
      
      // Never remove the perspective node
      if (characterId === state.activeCharacterId) {
        console.warn('Cannot remove the perspective character node')
        return
      }

      state.actions.removeNodeFromActiveGraph(characterId)
    },

    setRelationship: (targetId: string, label?: string) => {
      const state = store.getState()
      
      // Don't allow self-edges
      if (targetId === state.activeCharacterId) {
        console.warn('Cannot create a relationship to self')
        return
      }

      state.actions.addEdgeToActiveGraph(targetId, label)
    },

    removeRelationship: (targetId: string) => {
      store.getState().actions.removeEdgeFromActiveGraph(targetId)
    },

    renameCharacter: (id: string, name: string) => {
      store.getState().actions.updateCharacterField(id, 'name', name)
    },

    setCharacterImageUrl: (id: string, url: string) => {
      store.getState().actions.updateCharacterField(id, 'imageUrl', url)
    },

    setCharacterDescription: (id: string, text: string) => {
      store.getState().actions.updateCharacterField(id, 'description', text)
    },

    // TODO: Implement auto-layout algorithm (radial layout around POV)
    autoLayout: undefined,
  }
}
