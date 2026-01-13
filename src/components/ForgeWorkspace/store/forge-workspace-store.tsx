"use client"

import { createContext, useContext } from "react"
import type { PropsWithChildren } from "react"
import { createStore } from "zustand/vanilla"
import { useStore } from "zustand"
import { devtools } from "zustand/middleware"
import type { ForgeGraphDoc } from "@/src/types"
import type { BaseGameState } from "@/src/types/game-state"
import type { FlagSchema } from "@/src/types/flags"
import type { DialogueForgeEvent } from "@/src/components/forge/events/events"
import { createEvent } from "@/src/components/forge/events/events"
import { DIALOGUE_FORGE_EVENT_TYPE, DIALOGUE_OPEN_REASON } from "@/src/types/constants"
import { createGraphSlice } from "./slices/graph.slice"
import { createGameStateSlice } from "./slices/gameState.slice"
import { createViewStateSlice } from "./slices/viewState.slice"

export interface EventSink {
  emit(event: DialogueForgeEvent): void
}

export interface ForgeWorkspaceState {
  // Graph slice
  graphs: ReturnType<typeof createGraphSlice>["graphs"]
  narrativeGraph: ReturnType<typeof createGraphSlice>["narrativeGraph"]
  storyletGraph: ReturnType<typeof createGraphSlice>["storyletGraph"]
  
  // Game state slice
  activeFlagSchema: ReturnType<typeof createGameStateSlice>["activeFlagSchema"]
  activeGameState: ReturnType<typeof createGameStateSlice>["activeGameState"]
  gameStateDraft: ReturnType<typeof createGameStateSlice>["gameStateDraft"]
  gameStateError: ReturnType<typeof createGameStateSlice>["gameStateError"]
  
  // View state slice
  graphScope: ReturnType<typeof createViewStateSlice>["graphScope"]
  storyletFocusId: ReturnType<typeof createViewStateSlice>["storyletFocusId"]

  actions: {
    // Graph actions
    setGraph: ReturnType<typeof createGraphSlice>["setGraph"]
    setGraphStatus: ReturnType<typeof createGraphSlice>["setGraphStatus"]
    setNarrativeGraph: ReturnType<typeof createGraphSlice>["setNarrativeGraph"]
    setStoryletGraph: ReturnType<typeof createGraphSlice>["setStoryletGraph"]
    ensureGraph: ReturnType<typeof createGraphSlice>["ensureGraph"]
    
    // Game state actions
    setActiveFlagSchema: ReturnType<typeof createGameStateSlice>["setActiveFlagSchema"]
    setActiveGameState: ReturnType<typeof createGameStateSlice>["setActiveGameState"]
    setGameStateDraft: ReturnType<typeof createGameStateSlice>["setGameStateDraft"]
    setGameStateError: ReturnType<typeof createGameStateSlice>["setGameStateError"]
    
    // View state actions
    setGraphScope: ReturnType<typeof createViewStateSlice>["setGraphScope"]
    setStoryletFocusId: ReturnType<typeof createViewStateSlice>["setStoryletFocusId"]
  }
}

export interface CreateForgeWorkspaceStoreOptions {
  initialNarrativeGraph?: ForgeGraphDoc | null
  initialStoryletGraph?: ForgeGraphDoc | null
  flagSchema?: FlagSchema
  gameState?: BaseGameState
  resolveGraph?: (id: string) => Promise<ForgeGraphDoc>
}

export function createForgeWorkspaceStore(
  options: CreateForgeWorkspaceStoreOptions,
  eventSink: EventSink
) {
  const { flagSchema, gameState, initialNarrativeGraph, initialStoryletGraph, resolveGraph } = options

  return createStore<ForgeWorkspaceState>()(
    devtools(
      (set, get) => {
        const graphSlice = createGraphSlice(set, get, initialNarrativeGraph, initialStoryletGraph, resolveGraph)
        const gameStateSlice = createGameStateSlice(set, get, flagSchema, gameState)
        const viewStateSlice = createViewStateSlice(set, get)

        // Wrap setGraph to include event emission
        const setGraphWithEvents = (id: string, graph: ForgeGraphDoc) => {
          graphSlice.setGraph(id, graph)

          // Emit changed event
          eventSink.emit(
            createEvent(DIALOGUE_FORGE_EVENT_TYPE.DIALOGUE_CHANGED, {
              dialogueId: id,
              dialogue: graph,
              reason: "edit" as const,
            })
          )
        }

        // Wrap ensureGraph to include event emission
        const ensureGraphWithEvents = async (
          graphId: string,
          reason: "narrative" | "storylet",
          providedResolver?: (id: string) => Promise<ForgeGraphDoc>
        ) => {
          const state = get()
          
          // If already loaded, return
          if (state.graphs.byId[graphId] && state.graphs.statusById[graphId] === "ready") {
            return
          }

          // Emit open requested event
          eventSink.emit(
            createEvent(DIALOGUE_FORGE_EVENT_TYPE.DIALOGUE_OPEN_REQUESTED, {
              dialogueId: graphId,
              reason:
                reason === "narrative"
                  ? DIALOGUE_OPEN_REASON.PAGE
                  : DIALOGUE_OPEN_REASON.STORYLET_TEMPLATE,
            })
          )

          // Call the original ensureGraph
          await graphSlice.ensureGraph(graphId, reason, providedResolver)
        }

        return {
          ...graphSlice,
          ...gameStateSlice,
          ...viewStateSlice,
          actions: {
            // Graph actions
            setGraph: setGraphWithEvents,
            setGraphStatus: graphSlice.setGraphStatus,
            setNarrativeGraph: graphSlice.setNarrativeGraph,
            setStoryletGraph: graphSlice.setStoryletGraph,
            ensureGraph: ensureGraphWithEvents,
            
            // Game state actions
            setActiveFlagSchema: gameStateSlice.setActiveFlagSchema,
            setActiveGameState: gameStateSlice.setActiveGameState,
            setGameStateDraft: gameStateSlice.setGameStateDraft,
            setGameStateError: gameStateSlice.setGameStateError,
            
            // View state actions
            setGraphScope: viewStateSlice.setGraphScope,
            setStoryletFocusId: viewStateSlice.setStoryletFocusId,
          },
        }
      },
      { name: "ForgeWorkspaceStore" }
    )
  )
}

export type ForgeWorkspaceStore = ReturnType<typeof createForgeWorkspaceStore>

const ForgeWorkspaceStoreContext = createContext<ForgeWorkspaceStore | null>(null)

export function ForgeWorkspaceStoreProvider({
  store,
  children,
}: PropsWithChildren<{ store: ForgeWorkspaceStore }>) {
  return (
    <ForgeWorkspaceStoreContext.Provider value={store}>
      {children}
    </ForgeWorkspaceStoreContext.Provider>
  )
}

export function useForgeWorkspaceStore<T>(
  selector: (state: ForgeWorkspaceState) => T
): T {
  const store = useContext(ForgeWorkspaceStoreContext)
  if (!store) {
    throw new Error(
      "useForgeWorkspaceStore must be used within ForgeWorkspaceStoreProvider"
    )
  }
  return useStore(store, selector)
}
