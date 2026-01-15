import type { StateCreator } from "zustand"
import type { ForgeGameState } from "@/forge/types/forge-game-state"
import type { FlagSchema } from "@/forge/types/flags"
import type { ForgeWorkspaceState } from "../forge-workspace-store"

export interface GameStateSlice {
  activeFlagSchema: FlagSchema | undefined
  activeGameState: ForgeGameState
  gameStateDraft: string
  gameStateError: string | null
  loadedFlagSchemaProjectId: number | null
  loadedGameStateProjectId: number | null
}

export interface GameStateActions {
  setActiveFlagSchema: (schema: FlagSchema | undefined, projectId?: number | null) => void
  setActiveGameState: (state: ForgeGameState, projectId?: number | null) => void
  setGameStateDraft: (draft: string) => void
  setGameStateError: (error: string | null) => void
}

export function createGameStateSlice(
  set: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[0],
  get: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[1],
  flagSchema?: FlagSchema,
  gameState?: ForgeGameState
): GameStateSlice & GameStateActions {
  const initialGameState: ForgeGameState = gameState ?? { flags: {} }

  return {
    activeFlagSchema: flagSchema,
    activeGameState: initialGameState,
    gameStateDraft: JSON.stringify(initialGameState, null, 2),
    gameStateError: null,
    loadedFlagSchemaProjectId: null,
    loadedGameStateProjectId: null,
    setActiveFlagSchema: (schema, projectId) => set({ 
      activeFlagSchema: schema,
      loadedFlagSchemaProjectId: projectId ?? null,
    }),
    setActiveGameState: (state, projectId) => {
      set({
        activeGameState: state,
        gameStateDraft: JSON.stringify(state, null, 2),
        gameStateError: null,
        loadedGameStateProjectId: projectId ?? null,
      })
    },
    setGameStateDraft: draft => set({ gameStateDraft: draft }),
    setGameStateError: error => set({ gameStateError: error }),
  }
}
