import type { ForgeUIStore } from "@/src/components/forge/store/ui/createForgeUIStore"
import type { EventSink } from "../forge-workspace-store"
import { ForgeWorkspaceStore } from "../forge-workspace-store"
import { ForgeDataAdapter } from "@/src/components/forge/forge-data-adapter/forge-data-adapter"

/**
 * Setup subscriptions for side-effect events.
 * These subscriptions handle automatic behaviors like loading dialogues when IDs change.
 */
export function setupForgeWorkspaceSubscriptions(
  domainStore: ForgeWorkspaceStore,
  uiStore: ForgeUIStore,
  eventSink: EventSink,
  dataAdapter?: ForgeDataAdapter
) {

  // Note: Selection changes that need events are handled manually in action handlers
  // (e.g., in handleNarrativeElementSelect) rather than via subscriptions
}
