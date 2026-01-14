import type { EventSink } from "../forge-workspace-store"
import { ForgeWorkspaceStore } from "../forge-workspace-store"
import { ForgeDataAdapter } from "@/src/components/forge/forge-data-adapter/forge-data-adapter"
import { FORGE_GRAPH_KIND } from "@/src/types/forge/forge-graph"
import type { FlagSchema } from "@/src/types/flags"

/**
 * Setup subscriptions for side-effect events.
 * These subscriptions handle automatic behaviors like loading dialogues when IDs change.
 */
export function setupForgeWorkspaceSubscriptions(
  domainStore: ForgeWorkspaceStore,
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
        
        // 5. Load flag schema for this project
        try {
          const flagSchema = await dataAdapter.getFlagSchema(selectedProjectId)
          if (flagSchema && flagSchema.schema) {
            // Cast schema to FlagSchema type
            const schema = flagSchema.schema as FlagSchema
            state.actions.setActiveFlagSchema(schema)
          } else {
            state.actions.setActiveFlagSchema(undefined)
          }
        } catch (error) {
          console.error('Failed to load flag schema:', error)
          state.actions.setActiveFlagSchema(undefined)
        }
        
        // 6. Load game state for this project
        try {
          const gameState = await dataAdapter.getGameState(selectedProjectId)
          state.actions.setActiveGameState(gameState)
        } catch (error) {
          console.error('Failed to load game state:', error)
          // Set empty game state on error
          state.actions.setActiveGameState({ flags: {} })
        }
      } catch (error) {
        console.error('Failed to load project graphs:', error)
      }
    }
  )

  // Don't auto-select project - wait for user to select one
  // This prevents loading data on app launch when no project is set
}
