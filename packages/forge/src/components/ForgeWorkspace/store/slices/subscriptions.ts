import type {
  EventSink,
  ForgeWorkspaceStore,
} from '@magicborn/forge/components/ForgeWorkspace/store/forge-workspace-store';

/**
 * Forge project data loading is now component-driven (React Query hooks in ForgeWorkspace).
 * This function is kept as a compatibility no-op for callers that still import it.
 */
export function setupForgeWorkspaceSubscriptions(
  _domainStore: ForgeWorkspaceStore,
  _eventSink: EventSink
) {
  return () => undefined;
}
