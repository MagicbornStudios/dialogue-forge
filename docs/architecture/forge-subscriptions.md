# Forge Project Loading

Forge project loading is now component-driven with React Query hooks.

## Current Model

- `ForgeWorkspace` and `ForgeWorkspaceContent` call Forge hooks directly.
- Query results are written into the workspace store with explicit actions.
- Loading reacts to `selectedProjectId` via React effects in the workspace component.

## Hook Sources

Primary hooks live in `packages/forge/src/data/forge-queries.ts`:

- `useForgeGraphs(projectId, kind)`
- `useForgeFlagSchema(projectId)`
- `useForgeGameStates(projectId)`
- `useActiveForgeGameStateId(projectId)`
- `useForgeCharacters(projectId)`
- mutations for create/update/delete graph, page, game state, and related resources

## Store Sync Flow

1. Project changes in store (`selectedProjectId`).
2. Hooks resolve project-scoped data.
3. Effects in `ForgeWorkspaceContent` call store actions:
   - `setGraphs(...)`
   - `setActiveNarrativeGraphId(...)`
   - `setActiveStoryletGraphId(...)`
   - `setActiveFlagSchema(...)`
   - `setGameStates(...)`
4. UI reads only from store selectors.

## Compatibility Function

`setupForgeWorkspaceSubscriptions(...)` remains in
`packages/forge/src/components/ForgeWorkspace/store/slices/subscriptions.ts`
as a compatibility no-op for callers importing the old API.

New code should not depend on this function for data loading.

## Host Responsibility

Host app must provide:

- `QueryClientProvider`
- `ForgePayloadProvider`

Host app should not construct Forge data adapters.
