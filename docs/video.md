# Video

## Overview
Dialogue Forge includes a video workspace surface powered by Twick Studio for timeline editing and playback. The entry point is `VideoWorkspace` (and `VideoWorkspaceTwick`), exported from `src/video/index.ts`.

## Tech Stack
Video tooling uses:
- **React** for the workspace UI.
- **Shared UI primitives** (Button, Card, Badge) for consistent theming.
- **Template compilation utilities** for turning scenes/layers into runtime-ready compositions.

## Video Workspace Structure
`VideoWorkspaceTwick` renders Twick Studio inside the host app:
- **Twick Studio UI** for timeline editing and playback.
- **Thin wrapper** to provide contextId, dimensions, and providers.

The wrapper lives in `src/video/workspace/VideoWorkspaceTwick.tsx` and is kept intentionally thin.

## Templates & Compilation Pipeline
The video domain defines template types and a compilation pipeline:
- **Template types**: `VideoTemplate`, `VideoScene`, `VideoLayer`, and `VideoComposition` are exported from `src/video/templates/types/` via `src/video/index.ts`.
- **Compilation utilities**: `compile-template`, `normalize-timeline`, `resolve-bindings`, and related helpers live under `src/video/templates/compile/` and are exported from the same index for host use.

## How It Looks
The workspace UI is provided by Twick Studio. The host app wraps it at full height and width.

## How It Integrates
- **Adapters**: Contracts remain in `src/video/workspace/video-template-workspace-contracts.ts` and are implemented in the host app.
- **Shared UI**: The workspace uses shared UI primitives (Button, Card, Badge) and shared `cn` utilities for consistent styling across domains.

## Architecture Graphs
The latest generated dependency graphs and reports live in:
- `docs/architecture/graphs/dependency-cruiser.mmd` (Mermaid)
- `docs/architecture/graphs/dependency-cruiser.d2` (D2)
- `docs/architecture/graphs/madge.json` (Madge dependency map)
- `docs/architecture/dependency-cruiser.json` (raw cruise output)
- `docs/architecture/latest-analysis.md` (summary report)

## Related Docs
- [Shared UI and Utilities](./shared.md)
- [Architecture Boundaries](./architecture/BOUNDARIES.md)
- [Architecture Graphs](./architecture/graphs/README.md)
