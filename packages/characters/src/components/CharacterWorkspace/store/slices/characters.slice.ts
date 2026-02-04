/**
 * Characters slice for character workspace
 * Manages character CRUD and relationship graph mutations
 */

import type { CharacterDoc, Position, JointGraphJson } from '@magicborn/characters/types'

export interface CharactersSlice {
  // State
  charactersById: Record<string, CharacterDoc>
  activeCharacterId: string | null
}

export interface CharactersActions {
  setCharacters: (characters: CharacterDoc[]) => void
  setActiveCharacterId: (characterId: string | null) => void
  upsertCharacter: (character: CharacterDoc) => void
  removeCharacter: (characterId: string) => void
  updateCharacterField: (characterId: string, field: keyof CharacterDoc, value: any) => void

  // Graph mutation actions (operate on activeCharacter.relationshipGraphJson)
  setActiveGraphJson: (graphJson: JointGraphJson) => void
}

export function createCharactersSlice(
  set: any,
  get: any
): CharactersSlice & CharactersActions {
  return {
  // Initial state
  charactersById: {},
  activeCharacterId: null,

  // Actions
  setCharacters: (characters) => {
    set((state: CharactersSlice) => {
      state.charactersById = {}
      for (const char of characters) {
        state.charactersById[char.id] = char
      }
    })
  },

  setActiveCharacterId: (characterId) => {
    set((state: CharactersSlice) => {
      state.activeCharacterId = characterId
    })
  },

  upsertCharacter: (character) => {
    set((state: CharactersSlice) => {
      state.charactersById[character.id] = character
    })
  },

  removeCharacter: (characterId) => {
    set((state: CharactersSlice) => {
      delete state.charactersById[characterId]
      if (state.activeCharacterId === characterId) {
        state.activeCharacterId = null
      }
    })
  },

  updateCharacterField: (characterId, field, value) => {
    set((state: CharactersSlice) => {
      const character = state.charactersById[characterId]
      if (character) {
        (character as any)[field] = value
      }
    })
  },

  setActiveGraphJson: (graphJson) => {
    set((state: CharactersSlice) => {
      const activeId = state.activeCharacterId
      if (!activeId) return

      const activeChar = state.charactersById[activeId]
      if (activeChar) {
        activeChar.relationshipGraphJson = graphJson
      }
    })
  },
  }
}
