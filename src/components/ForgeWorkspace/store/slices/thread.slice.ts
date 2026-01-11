import type { StateCreator } from "zustand"
import type { StoryThread } from "@/src/types/narrative"
import type { NarrativeWorkspaceState } from "../narrative-workspace-store"

export interface ThreadSlice {
  thread: StoryThread
}

export interface ThreadActions {
  setThread: (thread: StoryThread) => void
  updateThread: (updater: (prev: StoryThread) => StoryThread) => void
}

const createEmptyThread = (): StoryThread => ({
  id: "empty-thread",
  title: "Empty Thread",
  acts: [],
})

export function createThreadSlice(
  set: Parameters<StateCreator<NarrativeWorkspaceState, [], [], NarrativeWorkspaceState>>[0],
  get: Parameters<StateCreator<NarrativeWorkspaceState, [], [], NarrativeWorkspaceState>>[1],
  initialThread?: StoryThread
): ThreadSlice & ThreadActions {
  return {
    thread: initialThread || createEmptyThread(),
    setThread: thread => set({ thread }),
    updateThread: updater => set(state => ({ thread: updater(state.thread) })),
  }
}
