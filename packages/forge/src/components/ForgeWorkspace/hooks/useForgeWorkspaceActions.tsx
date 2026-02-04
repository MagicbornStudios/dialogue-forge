// src/components/ForgeWorkspace/hooks/useForgeWorkspaceActions.tsx
import { useForgeWorkspaceStore } from '../store/forge-workspace-store'

/**
 * Hook providing workspace navigation actions.
 * These actions handle opening graphs, setting active IDs, and focus requests.
 * 
 * Note: This is separate from ForgeEditorActions which only handle
 * graph mutations and editor UI state.
 */
export function useForgeWorkspaceActions() {
  const openGraphInScope = useForgeWorkspaceStore((s) => s.actions.openGraphInScope)
  
  return {
    openStoryletGraph: (graphId: string, opts?: { focusNodeId?: string }) => {
      openGraphInScope('storylet', graphId, opts)
    },
    openNarrativeGraph: (graphId: string, opts?: { focusNodeId?: string }) => {
      openGraphInScope('narrative', graphId, opts)
    },
  }
}
