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

  // Track in-flight requests to prevent duplicates
  const inFlightRequests = new Set<string>()
  
  // Track previous project ID to only react to actual changes
  let previousProjectId: number | null = null
  
  // Subscribe to state changes, but only process when selectedProjectId actually changes
  domainStore.subscribe(
    async (state, prevState) => {
      const selectedProjectId = state.selectedProjectId
      
      // Only proceed if project ID actually changed
      if (selectedProjectId === previousProjectId) return
      previousProjectId = selectedProjectId
      
      if (!selectedProjectId) {
        // Clear active graphs when no project selected
        state.actions.setActiveNarrativeGraphId(null)
        state.actions.setActiveStoryletGraphId(null)
        return
      }
      
      // Check if we already have data for this project
      const hasFlagSchema = state.loadedFlagSchemaProjectId === selectedProjectId && state.activeFlagSchema
      const hasGameState = state.loadedGameStateProjectId === selectedProjectId && state.activeGameState
      
      // Check if storylet graphs are already loaded for this project
      const existingStoryletGraphs = Object.values(state.graphs.byId).filter(
        g => g.kind === FORGE_GRAPH_KIND.STORYLET && g.project === selectedProjectId
      )
      const hasStoryletGraphs = existingStoryletGraphs.length > 0
      
      try {
        // 1. Load project to get narrative graph ID (always needed)
        const projectRequestKey = `project-${selectedProjectId}`
        if (!inFlightRequests.has(projectRequestKey)) {
          inFlightRequests.add(projectRequestKey)
          try {
            const project = await dataAdapter.getProject(selectedProjectId)
            
            // 2. Load narrative graph if it exists
            if (project.narrativeGraph) {
              await state.actions.openGraphInScope(
                'narrative',
                String(project.narrativeGraph)
              )
            }
          } finally {
            inFlightRequests.delete(projectRequestKey)
          }
        }
        
        // 3. Load storylet graphs only if not already cached
        if (!hasStoryletGraphs) {
          const storyletRequestKey = `storylets-${selectedProjectId}`
          if (!inFlightRequests.has(storyletRequestKey)) {
            inFlightRequests.add(storyletRequestKey)
            try {
              const storyletGraphs = await dataAdapter.listGraphs(selectedProjectId, FORGE_GRAPH_KIND.STORYLET)
              const currentState = domainStore.getState()
              for (const graph of storyletGraphs) {
                currentState.actions.setGraph(String(graph.id), graph)
              }
              
              // Set first storylet as active if none selected
              if (storyletGraphs.length > 0 && !currentState.activeStoryletGraphId) {
                currentState.actions.setActiveStoryletGraphId(String(storyletGraphs[0].id))
              }
            } finally {
              inFlightRequests.delete(storyletRequestKey)
            }
          }
        }
        
        // 4. Load flag schema only if not already cached
        if (!hasFlagSchema) {
          const flagSchemaRequestKey = `flag-schema-${selectedProjectId}`
          if (!inFlightRequests.has(flagSchemaRequestKey)) {
            inFlightRequests.add(flagSchemaRequestKey)
            try {
              const flagSchema = await dataAdapter.getFlagSchema(selectedProjectId)
              const currentState = domainStore.getState()
              if (flagSchema && flagSchema.schema) {
                const schema = flagSchema.schema as FlagSchema
                currentState.actions.setActiveFlagSchema(schema, selectedProjectId)
              } else {
                currentState.actions.setActiveFlagSchema(undefined, selectedProjectId)
              }
            } catch (error) {
              console.error('Failed to load flag schema:', error)
              const currentState = domainStore.getState()
              currentState.actions.setActiveFlagSchema(undefined, selectedProjectId)
            } finally {
              inFlightRequests.delete(flagSchemaRequestKey)
            }
          }
        }
        
        // 5. Load game state only if not already cached
        if (!hasGameState) {
          const gameStateRequestKey = `game-state-${selectedProjectId}`
          if (!inFlightRequests.has(gameStateRequestKey)) {
            inFlightRequests.add(gameStateRequestKey)
            try {
              const gameState = await dataAdapter.getGameState(selectedProjectId)
              const currentState = domainStore.getState()
              currentState.actions.setActiveGameState(gameState, selectedProjectId)
            } catch (error) {
              console.error('Failed to load game state:', error)
              const currentState = domainStore.getState()
              // Set empty game state on error
              currentState.actions.setActiveGameState({ flags: {} }, selectedProjectId)
            } finally {
              inFlightRequests.delete(gameStateRequestKey)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load project data:', error)
      }
    }
  )

  // Don't auto-select project - wait for user to select one
  // This prevents loading data on app launch when no project is set
}
