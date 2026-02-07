# Forge

## Overview
Forge is the visual, node-based dialogue editor that powers the `/forge` workspace. It owns graph editing, Yarn Spinner import/export, flag-driven branching, and the runtime player used to simulate dialogue execution.

## Tech Stack
Forge is built on top of the core UI and graph tooling in the repo:
- **React + React Flow** for interactive graph editing.
- **Dagre + D3 hierarchy** for layout and graph algorithms.
- **Zustand + Immer** for workspace state (graph, game state, view state).
- **dnd-kit** for drag/drop interactions and node manipulation.
- **React Resizable Panels** for workspace layout.

## What Lives in the Forge Domain
- **Graph editing UI**: The Forge workspace lives in `packages/forge/src/components/ForgeWorkspace/` with the main shell at `ForgeWorkspace.tsx`.
- **Graph editors**: Narrative and storylet editors live under `GraphEditors/` as `ForgeNarrativeGraphEditor` and `ForgeStoryletGraphEditor`.
- **Node model + editors**: Node types (Act, Chapter, Page, Character, Player, Conditional, Storylet, Detour) and their editor fields; see architecture and how-to docs.
- **Runtime player surface**: The Forge workspace can embed a GamePlayer component for testing graph playback with flags (if wired).

## How It Looks
Forge follows a three-part workspace layout:
- **Menu bar + sidebar** at the top/left for navigation (narratives and storylets).
- **Graph editor panel** that switches between the narrative and storylet graph editors.
- **Player panel** for runtime simulation when needed.

## Graphs: Narrative vs Storylet
- **Narrative graph editor**: Acts, chapters, pages, conditional, detour, storylet nodes.
- **Storylet graph editor**: Character, player, conditional, storylet, detour nodes.

See [../architecture/dialogue-domain-and-yarn.md](../architecture/dialogue-domain-and-yarn.md) and [../how-to/forge-workspace-walkthrough.md](../how-to/forge-workspace-walkthrough.md).

## State & Data Flow
Forge follows the workspace architecture pattern:
- **Workspace store**: ForgeWorkspaceStore (graph, draft, gameState, viewState, project, subscriptions).
- **Session store**: ForgeEditorSessionStore (selection, layout direction, minimap toggles).
- **Command + shell pattern**: GraphEditors use command/action layer and editor shell hook.

## Runtime types
Forge's constants and types (e.g. for directives) live in `packages/shared/src/types/runtime.ts`. The former runtime execution engine and GamePlayer have been removed; Yarn conversion remains in `packages/forge/src/lib/yarn-converter/`.

## Architecture Graphs
- [../architecture/graphs/README.md](../architecture/graphs/README.md) for dependency-cruiser, madge, and reports.

## Host App Integration
Host-side adapters wire the workspace to PayloadCMS and runtime storage (e.g. `apps/host/app/lib/forge/` or equivalent).

## Related Docs
- [Dialogue domain and Yarn](../architecture/dialogue-domain-and-yarn.md)
- [Forge workspace walkthrough](../how-to/forge-workspace-walkthrough.md)
- [Workspace editor architecture](../architecture/workspace-editor-architecture.md)
- [Boundaries and patterns](../architecture/boundaries-and-patterns.md)
