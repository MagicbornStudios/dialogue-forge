import type { StateCreator } from "zustand"
import type { ForgeGameState, ForgeGameStateRecord } from "@/forge/types/forge-game-state"
import type { FlagSchema } from "@/forge/types/flags"
import type { ForgeWorkspaceState } from "../forge-workspace-store"

const DEFAULT_GAME_STATE: ForgeGameState = { flags: {} }

export interface GameStateSlice {
  activeFlagSchema: FlagSchema | undefined
  gameStatesById: Record<string, ForgeGameStateRecord>
  activeGameStateId: number | null
  activeGameState: ForgeGameState
  gameStateDraft: string
  gameStateError: string | null
  loadedFlagSchemaProjectId: number | null
  loadedGameStatesProjectId: number | null
}

export interface GameStateActions {
  setActiveFlagSchema: (schema: FlagSchema | undefined, projectId?: number | null) => void
  setGameStates: (states: ForgeGameStateRecord[], projectId?: number | null, activeGameStateId?: number | null) => void
  setActiveGameStateId: (gameStateId: number | null, projectId?: number | null) => void
  setActiveGameState: (state: ForgeGameState, projectId?: number | null) => void
  upsertGameState: (record: ForgeGameStateRecord, projectId?: number | null) => void
  removeGameState: (gameStateId: number, projectId?: number | null) => void
  setGameStateDraft: (draft: string) => void
  setGameStateError: (error: string | null) => void
}

export function createGameStateSlice(
  set: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[0],
  get: Parameters<StateCreator<ForgeWorkspaceState, [], [], ForgeWorkspaceState>>[1],
  flagSchema?: FlagSchema,
  gameState?: ForgeGameState
): GameStateSlice & GameStateActions {
  const initialGameState: ForgeGameState = gameState ?? DEFAULT_GAME_STATE

  return {
    activeFlagSchema: flagSchema,
    gameStatesById: {},
    activeGameStateId: null,
    activeGameState: initialGameState,
    gameStateDraft: JSON.stringify(initialGameState, null, 2),
    gameStateError: null,
    loadedFlagSchemaProjectId: null,
    loadedGameStatesProjectId: null,
    setActiveFlagSchema: (schema, projectId) => set({ 
      activeFlagSchema: schema,
      loadedFlagSchemaProjectId: projectId ?? null,
    }),
    setGameStates: (states, projectId, nextActiveGameStateId) => {
      const gameStatesById = states.reduce((acc, record) => {
        acc[String(record.id)] = record
        return acc
      }, {} as Record<string, ForgeGameStateRecord>)
      const resolvedActiveId = nextActiveGameStateId ?? get().activeGameStateId
      const resolvedActiveState = resolvedActiveId ? gameStatesById[String(resolvedActiveId)]?.state : undefined
      const fallbackRecord = states[0]
      const activeGameState = resolvedActiveState ?? fallbackRecord?.state ?? DEFAULT_GAME_STATE
      set({
        gameStatesById,
        activeGameStateId: resolvedActiveState ? resolvedActiveId : fallbackRecord?.id ?? null,
        activeGameState,
        gameStateDraft: JSON.stringify(activeGameState, null, 2),
        gameStateError: null,
        loadedGameStatesProjectId: projectId ?? null,
      })
    },
    setActiveGameStateId: (gameStateId, projectId) => {
      const stateRecord = gameStateId ? get().gameStatesById[String(gameStateId)] : undefined
      const nextState = stateRecord?.state ?? DEFAULT_GAME_STATE
      set({
        activeGameStateId: gameStateId,
        activeGameState: nextState,
        gameStateDraft: JSON.stringify(nextState, null, 2),
        gameStateError: null,
        loadedGameStatesProjectId: projectId ?? get().loadedGameStatesProjectId,
      })
    },
    setActiveGameState: (state, projectId) => {
      const activeGameStateId = get().activeGameStateId
      const gameStatesById = { ...get().gameStatesById }
      if (activeGameStateId !== null) {
        const existingRecord = gameStatesById[String(activeGameStateId)]
        if (existingRecord) {
          gameStatesById[String(activeGameStateId)] = {
            ...existingRecord,
            state,
          }
        }
      }
      set({
        gameStatesById,
        activeGameState: state,
        gameStateDraft: JSON.stringify(state, null, 2),
        gameStateError: null,
        loadedGameStatesProjectId: projectId ?? get().loadedGameStatesProjectId,
      })
    },
    upsertGameState: (record, projectId) => {
      const gameStatesById = {
        ...get().gameStatesById,
        [String(record.id)]: record,
      }
      const isActive = get().activeGameStateId === record.id
      set({
        gameStatesById,
        activeGameState: isActive ? record.state : get().activeGameState,
        gameStateDraft: isActive ? JSON.stringify(record.state, null, 2) : get().gameStateDraft,
        gameStateError: null,
        loadedGameStatesProjectId: projectId ?? get().loadedGameStatesProjectId,
      })
    },
    removeGameState: (gameStateId, projectId) => {
      const gameStatesById = { ...get().gameStatesById }
      delete gameStatesById[String(gameStateId)]
      const remaining = Object.values(gameStatesById)
      const nextActiveId = get().activeGameStateId === gameStateId ? (remaining[0]?.id ?? null) : get().activeGameStateId
      const nextActiveState = nextActiveId ? gameStatesById[String(nextActiveId)]?.state : DEFAULT_GAME_STATE
      set({
        gameStatesById,
        activeGameStateId: nextActiveId,
        activeGameState: nextActiveState ?? DEFAULT_GAME_STATE,
        gameStateDraft: JSON.stringify(nextActiveState ?? DEFAULT_GAME_STATE, null, 2),
        gameStateError: null,
        loadedGameStatesProjectId: projectId ?? get().loadedGameStatesProjectId,
      })
    },
    setGameStateDraft: draft => set({ gameStateDraft: draft }),
    setGameStateError: error => set({ gameStateError: error }),
  }
}
