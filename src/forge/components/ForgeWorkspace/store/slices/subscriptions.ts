import type { EventSink } from "@/forge/components/ForgeWorkspace/store/forge-workspace-store"
import { ForgeWorkspaceStore } from "@/forge/components/ForgeWorkspace/store/forge-workspace-store"
import { ForgeDataAdapter } from "@/forge/adapters/forge-data-adapter"
import type { FlagSchema } from "@/forge/types/flags"
import type { ForgeGameStateRecord } from "@/forge/types/forge-game-state"
import { FORGE_GRAPH_KIND } from "@/forge/types/forge-graph"

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
        state.actions.setGameStates([], null, null)
        return
      }
      
      // Check if we already have data for this project
      const hasFlagSchema = state.loadedFlagSchemaProjectId === selectedProjectId && state.activeFlagSchema
      const hasGameStates = state.loadedGameStatesProjectId === selectedProjectId && Object.keys(state.gameStatesById).length > 0
      
      // Check if graphs are already loaded for this project
      const existingNarrativeGraphs = Object.values(state.graphs.byId).filter(
        g => g.kind === FORGE_GRAPH_KIND.NARRATIVE && g.project === selectedProjectId
      )
      const hasNarrativeGraphs = existingNarrativeGraphs.length > 0
      
      const existingStoryletGraphs = Object.values(state.graphs.byId).filter(
        g => g.kind === FORGE_GRAPH_KIND.STORYLET && g.project === selectedProjectId
      )
      const hasStoryletGraphs = existingStoryletGraphs.length > 0
      
      try {
        // 1. Load narrative graphs only if not already cached
        if (!hasNarrativeGraphs) {
          const narrativeRequestKey = `narratives-${selectedProjectId}`
          if (!inFlightRequests.has(narrativeRequestKey)) {
            inFlightRequests.add(narrativeRequestKey)
            try {
              const narrativeGraphs = await dataAdapter.listGraphs(selectedProjectId, FORGE_GRAPH_KIND.NARRATIVE)
              const currentState = domainStore.getState()
              for (const graph of narrativeGraphs) {
                currentState.actions.setGraph(String(graph.id), graph)
              }
              
              // Set first narrative as active if none selected
              if (narrativeGraphs.length > 0 && !currentState.activeNarrativeGraphId) {
                currentState.actions.setActiveNarrativeGraphId(String(narrativeGraphs[0].id))
              }
            } finally {
              inFlightRequests.delete(narrativeRequestKey)
            }
          }
        }
        
        // 2. Load storylet graphs only if not already cached
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
        
        // 3. Load flag schema only if not already cached
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
        
        // 4. Load game states only if not already cached
        if (!hasGameStates) {
          const gameStateRequestKey = `game-states-${selectedProjectId}`
          if (!inFlightRequests.has(gameStateRequestKey)) {
            inFlightRequests.add(gameStateRequestKey)
            try {
              const gameStates = await dataAdapter.listGameStates(selectedProjectId)
              let activeGameStateId = await dataAdapter.getActiveGameStateId(selectedProjectId)
              let resolvedStates: ForgeGameStateRecord[] = gameStates

              if (!resolvedStates.length) {
                const defaultState = await dataAdapter.createGameState({
                  projectId: selectedProjectId,
                  name: 'Default State',
                  state: { flags: {} },
                })
                resolvedStates = [defaultState]
                activeGameStateId = defaultState.id
                await dataAdapter.setActiveGameState(selectedProjectId, defaultState.id)
              } else if (!activeGameStateId || !resolvedStates.some((state) => state.id === activeGameStateId)) {
                activeGameStateId = resolvedStates[0].id
                await dataAdapter.setActiveGameState(selectedProjectId, activeGameStateId)
              }

              const currentState = domainStore.getState()
              currentState.actions.setGameStates(resolvedStates, selectedProjectId, activeGameStateId)
            } catch (error) {
              console.error('Failed to load game states:', error)
              const currentState = domainStore.getState()
              currentState.actions.setGameStates([], selectedProjectId, null)
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
