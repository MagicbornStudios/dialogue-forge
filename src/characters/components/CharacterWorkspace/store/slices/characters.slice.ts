/**
 * Characters slice for character workspace
 * Manages character CRUD and relationship graph mutations
 */

import type { CharacterDoc, RelationshipFlow, Position } from '@/characters/types'

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

  // Graph mutation actions (operate on activeCharacter.relationshipFlow)
  addNodeToActiveGraph: (characterId: string, position: Position) => void
  moveNodeInActiveGraph: (characterId: string, position: Position) => void
  removeNodeFromActiveGraph: (characterId: string) => void
  addEdgeToActiveGraph: (targetId: string, label?: string) => void
  updateEdgeLabelInActiveGraph: (targetId: string, label: string) => void
  removeEdgeFromActiveGraph: (targetId: string) => void
  setActiveGraphFlow: (flow: RelationshipFlow) => void
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
    set((state) => {
      state.charactersById = {}
      for (const char of characters) {
        state.charactersById[char.id] = char
      }
    })
  },

  setActiveCharacterId: (characterId) => {
    set((state) => {
      state.activeCharacterId = characterId
    })
  },

  upsertCharacter: (character) => {
    set((state) => {
      state.charactersById[character.id] = character
    })
  },

  removeCharacter: (characterId) => {
    set((state) => {
      delete state.charactersById[characterId]
      if (state.activeCharacterId === characterId) {
        state.activeCharacterId = null
      }
    })
  },

  updateCharacterField: (characterId, field, value) => {
    set((state) => {
      const character = state.charactersById[characterId]
      if (character) {
        (character as any)[field] = value
      }
    })
  },

  // Graph mutations
  addNodeToActiveGraph: (characterId, position) => {
    set((state) => {
      const activeId = state.activeCharacterId
      if (!activeId) return

      const activeChar = state.charactersById[activeId]
      if (!activeChar) return

      // Initialize flow if needed
      if (!activeChar.relationshipFlow) {
        activeChar.relationshipFlow = { nodes: [], edges: [] }
      }

      // Check if node already exists
      const existingNode = activeChar.relationshipFlow.nodes.find((n: any) => n.id === characterId)
      if (existingNode) {
        // Just update position
        existingNode.position = position
        return
      }

      // Add new node
      activeChar.relationshipFlow.nodes.push({
        id: characterId,
        type: 'character',
        position,
        data: { characterId },
      })
    })
  },

  moveNodeInActiveGraph: (characterId, position) => {
    set((state) => {
      const activeId = state.activeCharacterId
      if (!activeId) return

      const activeChar = state.charactersById[activeId]
      if (!activeChar?.relationshipFlow) return

      const node = activeChar.relationshipFlow.nodes.find((n: any) => n.id === characterId)
      if (node) {
        node.position = position
      }
    })
  },

  removeNodeFromActiveGraph: (characterId) => {
    set((state) => {
      const activeId = state.activeCharacterId
      if (!activeId) return
      if (characterId === activeId) return // Never remove perspective node

      const activeChar = state.charactersById[activeId]
      if (!activeChar?.relationshipFlow) return

      // Remove node
      activeChar.relationshipFlow.nodes = activeChar.relationshipFlow.nodes.filter(
        (n: any) => n.id !== characterId
      )

      // Remove edges involving this node
      activeChar.relationshipFlow.edges = activeChar.relationshipFlow.edges.filter(
        (e: any) => e.target !== characterId
      )
    })
  },

  addEdgeToActiveGraph: (targetId, label) => {
    set((state) => {
      const activeId = state.activeCharacterId
      if (!activeId) return
      if (targetId === activeId) return // No self-edges

      const activeChar = state.charactersById[activeId]
      if (!activeChar) return

      // Initialize flow if needed
      if (!activeChar.relationshipFlow) {
        activeChar.relationshipFlow = { nodes: [], edges: [] }
      }

      const edgeId = `${activeId}->${targetId}`

      // Check if edge already exists
      const existingEdge = activeChar.relationshipFlow.edges.find((e: any) => e.id === edgeId)
      if (existingEdge) {
        // Update label if provided
        if (label !== undefined) {
          if (!existingEdge.data) existingEdge.data = {}
          existingEdge.data.label = label
        }
        return
      }

      // Add new edge (Option A: source is always activeId)
      activeChar.relationshipFlow.edges.push({
        id: edgeId,
        source: activeId,
        target: targetId,
        type: 'relationship',
        data: label ? { label } : undefined,
      })
    })
  },

  updateEdgeLabelInActiveGraph: (targetId, label) => {
    set((state) => {
      const activeId = state.activeCharacterId
      if (!activeId) return

      const activeChar = state.charactersById[activeId]
      if (!activeChar?.relationshipFlow) return

      const edgeId = `${activeId}->${targetId}`
      const edge = activeChar.relationshipFlow.edges.find((e: any) => e.id === edgeId)
      if (edge) {
        if (!edge.data) edge.data = {}
        edge.data.label = label
      }
    })
  },

  removeEdgeFromActiveGraph: (targetId) => {
    set((state) => {
      const activeId = state.activeCharacterId
      if (!activeId) return

      const activeChar = state.charactersById[activeId]
      if (!activeChar?.relationshipFlow) return

      const edgeId = `${activeId}->${targetId}`
      activeChar.relationshipFlow.edges = activeChar.relationshipFlow.edges.filter(
        (e: any) => e.id !== edgeId
      )
    })
  },

  setActiveGraphFlow: (flow) => {
    set((state) => {
      const activeId = state.activeCharacterId
      if (!activeId) return

      const activeChar = state.charactersById[activeId]
      if (activeChar) {
        activeChar.relationshipFlow = flow
      }
      })
    },
  }
}
