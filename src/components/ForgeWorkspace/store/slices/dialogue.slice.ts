import type { StateCreator } from "zustand"
import type { ForgeGraph } from "@/src/types"
import type { NarrativeWorkspaceState } from "../narrative-workspace-store"

export interface DialogueSlice {
  dialogue: {
    byId: Record<string, ForgeGraph>
    statusById: Record<string, "idle" | "loading" | "ready" | "error">
  }
}

export interface DialogueActions {
  setDialogue: (id: string, dialogue: ForgeGraph) => void
  setDialogueStatus: (id: string, status: DialogueSlice["dialogue"]["statusById"][string]) => void
  ensureDialogue: (
    dialogueId: string,
    reason: "page" | "storyletTemplate",
    resolveDialogue?: (id: string) => Promise<ForgeGraph>
  ) => Promise<void>
}

const createEmptyDialogue = (): ForgeGraph => ({
  id: "empty-dialogue",
  title: "Empty Dialogue",
  startNodeId: "",
  nodes: {},
})

export function createDialogueSlice(
  set: Parameters<StateCreator<NarrativeWorkspaceState, [], [], NarrativeWorkspaceState>>[0],
  get: Parameters<StateCreator<NarrativeWorkspaceState, [], [], NarrativeWorkspaceState>>[1],
  initialDialogue?: ForgeGraph
): DialogueSlice & DialogueActions {
  const initialDialogueMap: Record<string, ForgeGraph> = initialDialogue
    ? { [initialDialogue.id]: initialDialogue }
    : {}

  return {
    dialogue: {
      byId: initialDialogueMap,
      statusById: {},
    },
    setDialogue: (id, dialogue) =>
      set(state => ({
        dialogue: {
          ...state.dialogue,
          byId: { ...state.dialogue.byId, [id]: dialogue },
          statusById: { ...state.dialogue.statusById, [id]: "ready" },
        },
      })),
    setDialogueStatus: (id, status) =>
      set(state => ({
        dialogue: {
          ...state.dialogue,
          statusById: { ...state.dialogue.statusById, [id]: status },
        },
      })),
    ensureDialogue: async (dialogueId, reason, resolveDialogue) => {
      const state = get()
      // If already loaded, return
      if (state.dialogue.byId[dialogueId] && state.dialogue.statusById[dialogueId] === "ready") {
        return
      }

      // If no resolver, return
      if (!resolveDialogue) {
        return
      }

      // Set loading status
      set(state => ({
        dialogue: {
          ...state.dialogue,
          statusById: { ...state.dialogue.statusById, [dialogueId]: "loading" },
        },
      }))

      try {
        const tree = await resolveDialogue(dialogueId)
        set(state => ({
          dialogue: {
            ...state.dialogue,
            byId: { ...state.dialogue.byId, [dialogueId]: tree },
            statusById: { ...state.dialogue.statusById, [dialogueId]: "ready" },
          },
        }))
      } catch (error) {
        set(state => ({
          dialogue: {
            ...state.dialogue,
            statusById: { ...state.dialogue.statusById, [dialogueId]: "error" },
          },
        }))
        throw error
      }
    },
  }
}
