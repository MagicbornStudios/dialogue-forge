import type { NarrativeWorkspaceStore } from "./narrative-workspace-store"
import type { ForgeUIStore } from "@/src/components/forge/store/ui/createForgeUIStore"
import type { EventSink } from "./narrative-workspace-store"

/**
 * Setup subscriptions for side-effect events.
 * These subscriptions handle automatic behaviors like loading dialogues when IDs change.
 */
export function setupNarrativeWorkspaceSubscriptions(
  domainStore: NarrativeWorkspaceStore,
  uiStore: ForgeUIStore,
  eventSink: EventSink
) {
  let previousPageDialogueId: string | null = null
  let previousStoryletDialogueId: string | null = null

  // Subscribe to pageDialogueId changes → ensure dialogue is loaded
  uiStore.subscribe((state) => {
    const pageDialogueId = state.dialogueGraph.pageDialogueId
    if (pageDialogueId && pageDialogueId !== previousPageDialogueId) {
      previousPageDialogueId = pageDialogueId
      const domainState = domainStore.getState()
      // The ensureDialogue action already handles event emission
      // It will use the resolveDialogue from the store closure
      void domainState.actions.ensureDialogue(pageDialogueId, "page", domainState.resolveDialogue)
    }
  })

  // Subscribe to storyletDialogueId changes → ensure dialogue is loaded
  uiStore.subscribe((state) => {
    const storyletDialogueId = state.dialogueGraph.storyletDialogueId
    if (storyletDialogueId && storyletDialogueId !== previousStoryletDialogueId) {
      previousStoryletDialogueId = storyletDialogueId
      const domainState = domainStore.getState()
      void domainState.actions.ensureDialogue(storyletDialogueId, "storyletTemplate", domainState.resolveDialogue)
    }
  })

  // Note: Selection changes that need events are handled manually in action handlers
  // (e.g., in handleNarrativeElementSelect) rather than via subscriptions
}
