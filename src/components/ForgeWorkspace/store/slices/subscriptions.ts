import type { ForgeUIStore } from "@/src/components/forge/store/ui/createForgeUIStore"
import type { EventSink } from "../forge-workspace-store"
import { ForgeWorkspaceStore } from "../forge-workspace-store"
import { ForgeDataAdapter } from "@/src/components/forge/forge-data-adapter/forge-data-adapter"
import { FORGE_GRAPH_KIND } from "@/src/types/forge/forge-graph"

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
  if (!dataAdapter) return

  // Subscribe to selectedProjectId changes
  let previousProjectId: number | null = null
  
  domainStore.subscribe(
    async (state) => {
      const selectedProjectId = state.selectedProjectId
      
      // Skip if project didn't actually change
      if (selectedProjectId === previousProjectId) return
      previousProjectId = selectedProjectId
      
      if (!selectedProjectId) {
        // Clear active graphs when no project selected
        state.actions.setActiveNarrativeGraphId(null)
        state.actions.setActiveStoryletGraphId(null)
        return
      }
      
      try {
        // 1. Load project to get narrative graph ID
        const project = await dataAdapter.getProject(selectedProjectId)
        
        // 2. Load narrative graph if it exists
        if (project.narrativeGraph) {
          await state.actions.openGraphInScope(
            'narrative',
            String(project.narrativeGraph)
          )
        }
        
        // 3. Load all storylet graphs for this project into cache
        const storyletGraphs = await dataAdapter.listGraphs(selectedProjectId, FORGE_GRAPH_KIND.STORYLET)
        for (const graph of storyletGraphs) {
          state.actions.setGraph(String(graph.id), graph)
        }
        
        // 4. Set first storylet as active if none selected
        const currentState = domainStore.getState()
        if (storyletGraphs.length > 0 && !currentState.activeStoryletGraphId) {
          currentState.actions.setActiveStoryletGraphId(String(storyletGraphs[0].id))
        }
      } catch (error) {
        console.error('Failed to load project graphs:', error)
      }
    }
  )

  // Auto-select first project on mount if none selected
  const initialState = domainStore.getState()
  if (!initialState.selectedProjectId) {
    dataAdapter.listProjects().then((projects) => {
      if (projects.length > 0) {
        domainStore.getState().actions.setSelectedProjectId(projects[0].id)
      }
    }).catch((error) => {
      console.error('Failed to list projects for auto-selection:', error)
    })
  }
}
