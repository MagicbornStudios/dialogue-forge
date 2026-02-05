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
- **Graph editors**: Narrative and storylet editors live under `GraphEditors/` and are referenced by name as `ForgeNarrativeGraphEditor` and `ForgeStoryletGraphEditor` in the Forge workspace layout pattern.
- **Node model + editors**: Node types (NPC, Player, Conditional, Storylet, Storylet Groups) and their editor fields are documented in `docs/nodes-and-editors.md`. That doc links to the node editor components that Forge uses for field-level editing.
- **Runtime player surface**: The Forge workspace embeds a `GamePlayer` component for testing graph playback with flags and completion callbacks.

## How It Looks
Forge follows a three-part workspace layout:
- **Menu bar + sidebar** at the top/left for navigation (storylets vs nodes).
- **Graph editor panel** that switches between the narrative and storylet graph editors.
- **Player panel** for runtime simulation when needed.

See the Forge workspace layout snippet in the parity report for the canonical structure.

## Graphs: Narrative vs Storylet
Forge runs two graph editors with different scopes:
- **Narrative graph editor** (`ForgeNarrativeGraphEditor`): The default graph for the main narrative flow.
- **Storylet graph editor** (`ForgeStoryletGraphEditor`): Dedicated editing surface for storylet-focused graphs.

The Forge workspace layout explicitly toggles between these two editors, as documented in the parity report that illustrates the workspace composition.

## State & Data Flow (Forge Workspace)
Forge follows the workspace architecture pattern:
- **Workspace store**: `ForgeWorkspaceStore` provides persistent domain state (graphs, flags, UI layout, project selection). It is slice-based: graph, gameState, viewState, project.
- **Session store**: `ForgeEditorSessionStore` holds per-editor UI state (selection, layout direction, minimap toggles).
- **Command + shell pattern**: Forge’s GraphEditors use a command/action layer and an editor shell hook to bridge React Flow with domain state, per the workspace architecture guide.

If you are extending the graph editor, start with:
- `docs/architecture/workspace-editor-architecture.md` for state + command patterns.
- `docs/nodes-and-editors.md` for node semantics and editor component entry points.

## Runtime types
Forge’s constants and types (e.g. for directives) live in `packages/shared/src/types/runtime.ts`. The former runtime execution engine and GamePlayer have been removed; Yarn conversion remains in `packages/forge/src/lib/yarn-converter/`.

## Architecture Graphs
The latest generated dependency graphs and reports live in:
- `docs/architecture/graphs/dependency-cruiser.mmd` (Mermaid)
- `docs/architecture/graphs/dependency-cruiser.d2` (D2)
- `docs/architecture/graphs/madge.json` (Madge dependency map)
- `docs/architecture/dependency-cruiser.json` (raw cruise output)
- `docs/architecture/latest-analysis.md` (summary report)

## Host App Integration
Host-side adapters live in `apps/host/app/lib/forge/` and wire the workspace to PayloadCMS and runtime storage, as outlined in the repo structure section of the README.

## Related Docs
- [Dialogue Nodes & Editors](./nodes-and-editors.md)
- [Workspace Editor Architecture](./architecture/workspace-editor-architecture.md)
- [Architecture Boundaries](./architecture/BOUNDARIES.md)
- [Store Inventory & Graph/State Plans](./reorg-discovery/04-store-inventory.md)
- [Forge ↔ Writer Parity Plan](./reorg-discovery/06-writer-vs-forge-parity.md)
- [Architecture Graphs](./architecture/graphs/README.md)

