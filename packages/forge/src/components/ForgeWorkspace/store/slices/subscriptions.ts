import type { EventSink } from "@magicborn/forge/components/ForgeWorkspace/store/forge-workspace-store"
import type { ForgeWorkspaceStore } from "@magicborn/forge/components/ForgeWorkspace/store/forge-workspace-store"
import type { ForgeDataAdapter } from "@magicborn/forge/adapters/forge-data-adapter"
import type { FlagSchema } from "@magicborn/forge/types/flags"
import type { ForgeGameStateRecord } from "@magicborn/shared/types/forge-game-state"
import { FORGE_GRAPH_KIND } from "@magicborn/forge/types/forge-graph"

/**
 * Callback implemented by the host or built from adapter: fetch project-scoped data and sync into the store.
 * Called when selectedProjectId changes.
 */
export type LoadForgeProjectData = (
  projectId: number,
  store: ForgeWorkspaceStore
) => Promise<void>

/**
 * Build LoadForgeProjectData from an adapter. Use this in ForgeWorkspace when context provides an adapter.
 */
export async function loadForgeProjectDataWithAdapter(
  adapter: ForgeDataAdapter,
  projectId: number,
  store: ForgeWorkspaceStore
): Promise<void> {
  const state = store.getState()

  const [narrativeGraphs, storyletGraphs, flagSchema, gameStates, activeGameStateId] = await Promise.all([
    adapter.listGraphs(projectId, FORGE_GRAPH_KIND.NARRATIVE),
    adapter.listGraphs(projectId, FORGE_GRAPH_KIND.STORYLET),
    adapter.getFlagSchema(projectId),
    adapter.listGameStates(projectId),
    adapter.getActiveGameStateId(projectId),
  ])

  if (narrativeGraphs.length > 0) {
    state.actions.setGraphs(narrativeGraphs)
    if (!state.activeNarrativeGraphId) {
      state.actions.setActiveNarrativeGraphId(String(narrativeGraphs[0].id))
    }
  }
  if (storyletGraphs.length > 0) {
    state.actions.setGraphs(storyletGraphs)
    if (!state.activeStoryletGraphId) {
      state.actions.setActiveStoryletGraphId(String(storyletGraphs[0].id))
    }
  }

  if (flagSchema?.schema) {
    state.actions.setActiveFlagSchema(flagSchema.schema as FlagSchema, projectId)
  } else {
    state.actions.setActiveFlagSchema(undefined, projectId)
  }

  let resolvedStates: ForgeGameStateRecord[] = gameStates
  let resolvedActiveId = activeGameStateId

  if (!resolvedStates.length) {
    const defaultState = await adapter.createGameState({
      projectId,
      name: "Default State",
      state: { flags: {} },
    })
    resolvedStates = [defaultState]
    resolvedActiveId = defaultState.id
    await adapter.setActiveGameState(projectId, defaultState.id)
  } else if (
    !resolvedActiveId ||
    !resolvedStates.some((s) => s.id === resolvedActiveId)
  ) {
    resolvedActiveId = resolvedStates[0].id
    await adapter.setActiveGameState(projectId, resolvedActiveId)
  }

  state.actions.setGameStates(resolvedStates, projectId, resolvedActiveId)
}

/**
 * Setup subscriptions for side-effect events.
 * When selectedProjectId changes, calls loadProjectData(projectId, store).
 */
export function setupForgeWorkspaceSubscriptions(
  domainStore: ForgeWorkspaceStore,
  _eventSink: EventSink,
  loadProjectData?: LoadForgeProjectData
) {
  if (!loadProjectData) return

  let previousProjectId: number | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  domainStore.subscribe((state) => {
    const selectedProjectId = state.selectedProjectId
    if (selectedProjectId === previousProjectId) return
    previousProjectId = selectedProjectId

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      if (!selectedProjectId) {
        const currentState = domainStore.getState()
        currentState.actions.setActiveNarrativeGraphId(null)
        currentState.actions.setActiveStoryletGraphId(null)
        currentState.actions.setGameStates([], null, null)
        return
      }
      loadProjectData(selectedProjectId, domainStore).catch((err) =>
        console.error("Failed to load project data:", err)
      )
    }, 100)
  })
}
