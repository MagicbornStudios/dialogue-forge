import type { StateCreator } from "zustand"
import type { BaseGameState } from "@/src/types/game-state"
import type { FlagSchema } from "@/src/types/flags"
import type { ForgeWorkspaceState } from "../forge-workspace-store"

export interface GameStateSlice {
  activeFlagSchema: FlagSchema | undefined
  activeGameState: BaseGameState
  gameStateDraft: string
  gameStateError: string | null
}

export interface GameStateActions {
  setActiveFlagSchema: (schema: FlagSchema | undefined) => void
  setActiveGameState: (state: BaseGameState) => void
  setGameStateDraft: (draft: string) => void
  setGameStateError: (error: string | null) => void
}

export function createGameStateSlice(
  set: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[0],
  get: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[1],
  flagSchema?: FlagSchema,
  gameState?: BaseGameState
): GameStateSlice & GameStateActions {
  const initialGameState: BaseGameState = gameState ?? { flags: {} }

  return {
    activeFlagSchema: flagSchema,
    activeGameState: initialGameState,
    gameStateDraft: JSON.stringify(initialGameState, null, 2),
    gameStateError: null,
    setActiveFlagSchema: schema => set({ activeFlagSchema: schema }),
    setActiveGameState: state => {
      set({
        activeGameState: state,
        gameStateDraft: JSON.stringify(state, null, 2),
        gameStateError: null,
      })
    },
    setGameStateDraft: draft => set({ gameStateDraft: draft }),
    setGameStateError: error => set({ gameStateError: error }),
  }
}
