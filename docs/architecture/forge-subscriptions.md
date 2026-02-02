# Forge Workspace Subscriptions

Forge workspace subscriptions are a **store-side effect layer**: they react to store changes (e.g. `selectedProjectId`) and keep the store populated with contextual data by calling the `dataAdapter` and updating state. They do **not** expose a component API; components only read from the store.

## Purpose

- **React to store changes** (e.g. when the user selects a project).
- **Request contextual data** for that context (narrative/storylet graphs, flag schema, game states) via the `dataAdapter`.
- **Update the store** with the fetched data so the UI (sidebar lists, editors, modals) can read it without knowing where it came from.

Subscriptions run **outside React** (Zustand `subscribe`). They are set up once when the workspace mounts and keep the store in sync with the selected project.

## What they do today

A single subscription is registered in [`src/forge/components/ForgeWorkspace/store/slices/subscriptions.ts`](../../src/forge/components/ForgeWorkspace/store/slices/subscriptions.ts) via `setupForgeWorkspaceSubscriptions(store, eventSink, dataAdapter)`.

**When `selectedProjectId` changes:**

1. **No project selected:** Clear active narrative/storylet graph IDs and game states in the store.
2. **Project selected:** For that project, load (only if not already cached):
   - **Narrative graphs** — `dataAdapter.listGraphs(projectId, NARRATIVE)` → `setGraphs(...)` (one batch). If no active narrative is set, set the first graph as active.
   - **Storylet graphs** — same for storylets.
   - **Flag schema** — `dataAdapter.getFlagSchema(projectId)` → `setActiveFlagSchema(...)`.
   - **Game states** — `dataAdapter.listGameStates(projectId)` + active state resolution → `setGameStates(...)`; create a default state if none exist.

**Safeguards:**

- In-flight request keys prevent duplicate concurrent requests for the same project/kind.
- Cache checks (e.g. `hasNarrativeGraphs`, `loadedFlagSchemaProjectId`) avoid refetching when data is already in the store.
- Graph loading uses batched `setGraphs` so one project switch does not trigger a flood of store updates and re-renders.

The store type and actions are defined in [`forge-workspace-store.tsx`](../../src/forge/components/ForgeWorkspace/store/forge-workspace-store.tsx).

## How components and workspaces use them

Components **do not** "use subscriptions" directly. They use the store (`useForgeWorkspaceStore`) and, when needed, the adapter (via store or props).

**Data flow:**

1. **Project selection** — Host app or `ProjectSync` sets `selectedProjectId` in the store (e.g. from a project switcher).
2. **Subscription runs** — The subscription callback sees the new `selectedProjectId` and, if a project is set, fetches graphs, flag schema, and game states via `dataAdapter`, then updates the store.
3. **Store updates** — `setGraphs`, `setActiveFlagSchema`, `setGameStates`, etc. update the Zustand store.
4. **Components re-render** — Sidebar lists (narratives, storylets), editors, and modals read from the store and re-render with the new data.

So: **project switcher → subscription → adapter → store → components**. Components never call the subscription or the adapter for this initial load; they only read from the store.

## Comparison with other apps

| Pattern | How it works | How we differ or align |
|--------|----------------|-------------------------|
| **Redux middleware / listeners** | React to actions or state changes; dispatch further actions or fetch and dispatch results. | Same idea: react to state change, run side effects, update state. We use a single Zustand `subscribe` and call store actions directly instead of dispatching. |
| **React Query / SWR** | Component-level hooks + cache; fetch when component mounts or when keys change. | Ours is **store-level** and **adapter-driven**; no component mount is required for the initial load when the project changes. Optional "on-demand" loading (e.g. when subscriptions are off) could be implemented with a hook that calls the adapter and `setGraphs` for a given project/kind. |
| **MobX reactions** | React to observable changes and run side effects. | Conceptually similar. We use one subscription over the whole store instead of fine-grained reactions. |

## Considerations

- **Batching:** Use `setGraphs` (and single updates for active graph, flag schema, game state) so one project switch does not trigger a flood of store updates and re-renders. Avoid calling `setGraph` in a loop for many graphs.
- **No project auto-selection:** Subscriptions only run when `selectedProjectId` is set (e.g. by the host or `ProjectSync`). We do not auto-select a project on init; that is the host’s responsibility.
- **Adapter required:** If `dataAdapter` is missing, `setupForgeWorkspaceSubscriptions` does nothing. The host must provide the adapter for persistence and loading.
- **Optional future:** A workspace config flag (e.g. `subscriptionsEnabled`) could turn subscriptions on/off. When off, the host or a dedicated hook could load project data on demand (e.g. when the sidebar list is shown).
