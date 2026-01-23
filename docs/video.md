# Video

## Overview
Dialogue Forge includes a video template workspace for assembling scene/layer timelines, previewing playback, and wiring media inputs. The entry point is `VideoTemplateWorkspace`, exported from `src/video/index.ts`.

## Tech Stack
Video tooling uses:
- **React** for the workspace UI.
- **Shared UI primitives** (Button, Card, Badge) for consistent theming.
- **Template compilation utilities** for turning scenes/layers into runtime-ready compositions.

## Video Workspace Structure
`VideoTemplateWorkspace` composes the main UI panels:
- **Scene and layer lists** for navigation and selection.
- **Preview panel** for playback and media resolution status.
- **Layer inspector** for editing layer settings.
- **Timeline** for sequencing scene playback.

These components are orchestrated in `VideoTemplateWorkspace.tsx` with adapters for media resolution and selection callbacks.

## Templates & Compilation Pipeline
The video domain defines template types and a compilation pipeline:
- **Template types**: `VideoTemplate`, `VideoScene`, `VideoLayer`, and `VideoComposition` are exported from `src/video/templates/types/` via `src/video/index.ts`.
- **Compilation utilities**: `compile-template`, `normalize-timeline`, `resolve-bindings`, and related helpers live under `src/video/templates/compile/` and are exported from the same index for host use.

## How It Looks
The workspace is a three-column layout with navigation on the left, a preview canvas in the center, and a layer inspector on the right, followed by a timeline row beneath the preview.

## How It Integrates
- **Adapters**: `VideoTemplateWorkspace` accepts a `VideoTemplateWorkspaceAdapter` to resolve media resources and integrate host-side persistence.
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
