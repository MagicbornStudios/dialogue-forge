"use client"

import { createContext, useContext } from "react"
import type { PropsWithChildren } from "react"
import { createStore } from "zustand/vanilla"
import { useStore } from "zustand"
import { devtools } from "zustand/middleware"
import type { StoryThread } from "@/src/types/narrative"
import type { DialogueTree } from "@/src/types"
import type { BaseGameState } from "@/src/types/game-state"
import type { FlagSchema } from "@/src/types/flags"
import type { DialogueForgeEvent } from "@/src/components/forge/events/events"
import { createEvent } from "@/src/components/forge/events/events"
import { DIALOGUE_FORGE_EVENT_TYPE, DIALOGUE_OPEN_REASON } from "@/src/types/constants"
import { createThreadSlice } from "./slices/thread.slice"
import { createDialogueSlice } from "./slices/dialogue.slice"
import { createGameStateSlice } from "./slices/gameState.slice"
import { createViewStateSlice } from "./slices/viewState.slice"

export interface EventSink {
  emit(event: DialogueForgeEvent): void
}

export interface NarrativeWorkspaceState {
  thread: ReturnType<typeof createThreadSlice>["thread"]
  dialogue: ReturnType<typeof createDialogueSlice>["dialogue"]
  activeFlagSchema: ReturnType<typeof createGameStateSlice>["activeFlagSchema"]
  activeGameState: ReturnType<typeof createGameStateSlice>["activeGameState"]
  gameStateDraft: ReturnType<typeof createGameStateSlice>["gameStateDraft"]
  gameStateError: ReturnType<typeof createGameStateSlice>["gameStateError"]
  dialogueScope: ReturnType<typeof createViewStateSlice>["dialogueScope"]
  storyletFocusId: ReturnType<typeof createViewStateSlice>["storyletFocusId"]
  resolveDialogue?: (dialogueId: string) => Promise<DialogueTree>

  actions: {
    setThread: ReturnType<typeof createThreadSlice>["setThread"]
    updateThread: ReturnType<typeof createThreadSlice>["updateThread"]
    setDialogue: ReturnType<typeof createDialogueSlice>["setDialogue"]
    setDialogueStatus: ReturnType<typeof createDialogueSlice>["setDialogueStatus"]
    ensureDialogue: ReturnType<typeof createDialogueSlice>["ensureDialogue"]
    setActiveFlagSchema: ReturnType<typeof createGameStateSlice>["setActiveFlagSchema"]
    setActiveGameState: ReturnType<typeof createGameStateSlice>["setActiveGameState"]
    setGameStateDraft: ReturnType<typeof createGameStateSlice>["setGameStateDraft"]
    setGameStateError: ReturnType<typeof createGameStateSlice>["setGameStateError"]
    setDialogueScope: ReturnType<typeof createViewStateSlice>["setDialogueScope"]
    setStoryletFocusId: ReturnType<typeof createViewStateSlice>["setStoryletFocusId"]
  }
}

export interface CreateNarrativeWorkspaceStoreOptions {
  initialThread?: StoryThread
  initialDialogue?: DialogueTree
  flagSchema?: FlagSchema
  gameState?: BaseGameState
  resolveDialogue?: (dialogueId: string) => Promise<DialogueTree>
}

export function createNarrativeWorkspaceStore(
  options: CreateNarrativeWorkspaceStoreOptions,
  eventSink: EventSink
) {
  const { initialThread, initialDialogue, flagSchema, gameState, resolveDialogue } = options

  return createStore<NarrativeWorkspaceState>()(
    devtools(
      (set, get) => {
        const threadSlice = createThreadSlice(set, get, initialThread)
        const dialogueSlice = createDialogueSlice(set, get, initialDialogue)
        const gameStateSlice = createGameStateSlice(set, get, flagSchema, gameState)
        const viewStateSlice = createViewStateSlice(set, get)

        // Wrap ensureDialogue to include event emission
        const ensureDialogueWithEvents = async (
          dialogueId: string,
          reason: "page" | "storyletTemplate",
          providedResolveDialogue?: (id: string) => Promise<DialogueTree>
        ) => {
          const state = get()
          // If already loaded, return
          if (state.dialogue.byId[dialogueId] && state.dialogue.statusById[dialogueId] === "ready") {
            return
          }

          // Use provided resolver or fallback to store's resolver
          const resolver = providedResolveDialogue ?? resolveDialogue

          // Emit open requested event
          eventSink.emit(
            createEvent(DIALOGUE_FORGE_EVENT_TYPE.DIALOGUE_OPEN_REQUESTED, {
              dialogueId,
              reason:
                reason === "page"
                  ? DIALOGUE_OPEN_REASON.PAGE
                  : DIALOGUE_OPEN_REASON.STORYLET_TEMPLATE,
            })
          )

          // Call the original ensureDialogue
          await dialogueSlice.ensureDialogue(dialogueId, reason, resolver)
        }

        // Wrap setDialogue to include event emission (debouncing handled by event handlers)
        const setDialogueWithEvents = (id: string, dialogue: DialogueTree) => {
          dialogueSlice.setDialogue(id, dialogue)

          // Emit changed event
          eventSink.emit(
            createEvent(DIALOGUE_FORGE_EVENT_TYPE.DIALOGUE_CHANGED, {
              dialogueId: id,
              dialogue,
              reason: "edit" as const,
            })
          )
        }

        return {
          ...threadSlice,
          ...dialogueSlice,
          ...gameStateSlice,
          ...viewStateSlice,
          resolveDialogue,
          actions: {
            setThread: threadSlice.setThread,
            updateThread: threadSlice.updateThread,
            setDialogue: setDialogueWithEvents,
            setDialogueStatus: dialogueSlice.setDialogueStatus,
            ensureDialogue: ensureDialogueWithEvents,
            setActiveFlagSchema: gameStateSlice.setActiveFlagSchema,
            setActiveGameState: gameStateSlice.setActiveGameState,
            setGameStateDraft: gameStateSlice.setGameStateDraft,
            setGameStateError: gameStateSlice.setGameStateError,
            setDialogueScope: viewStateSlice.setDialogueScope,
            setStoryletFocusId: viewStateSlice.setStoryletFocusId,
          },
        }
      },
      { name: "NarrativeWorkspaceStore" }
    )
  )
}

export type NarrativeWorkspaceStore = ReturnType<typeof createNarrativeWorkspaceStore>

const NarrativeWorkspaceStoreContext = createContext<NarrativeWorkspaceStore | null>(null)

export function NarrativeWorkspaceStoreProvider({
  store,
  children,
}: PropsWithChildren<{ store: NarrativeWorkspaceStore }>) {
  return (
    <NarrativeWorkspaceStoreContext.Provider value={store}>
      {children}
    </NarrativeWorkspaceStoreContext.Provider>
  )
}

export function useNarrativeWorkspaceStore<T>(
  selector: (state: NarrativeWorkspaceState) => T
): T {
  const store = useContext(NarrativeWorkspaceStoreContext)
  if (!store) {
    throw new Error(
      "useNarrativeWorkspaceStore must be used within NarrativeWorkspaceStoreProvider"
    )
  }
  return useStore(store, selector)
}
