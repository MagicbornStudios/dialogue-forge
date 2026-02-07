# Video

## Overview
Dialogue Forge includes a video workspace surface powered by Twick Studio for timeline editing and playback. The entry point is `VideoWorkspace` (and `VideoWorkspaceTwick`), exported from `packages/video/src/index.ts`.

## Tech Stack
Video tooling uses:
- **React** for the workspace UI.
- **Shared UI primitives** (Button, Card, Badge) for consistent theming.
- **Template compilation utilities** for turning scenes/layers into runtime-ready compositions.

## Video Workspace Structure
`VideoWorkspaceTwick` renders Twick Studio inside the host app:
- **Twick Studio UI** for timeline editing and playback.
- **Thin wrapper** to provide contextId, dimensions, and providers.

The wrapper lives in `packages/video/src/workspace/VideoWorkspaceTwick.tsx` and is kept intentionally thin.

## Templates & Compilation Pipeline
- **Template types**: `VideoTemplate`, `VideoScene`, `VideoLayer`, `VideoComposition` from `packages/video/src/templates/types/`.
- **Compilation utilities**: compile-template, normalize-timeline, resolve-bindings under `packages/video/src/templates/compile/`.

## How It Integrates
- **Adapters**: Contracts in `packages/video/src/workspace/video-template-workspace-contracts.ts`; host implements.
- **Shared UI**: Workspace uses shared UI primitives and shared `cn` utilities.

## Related Docs
- [Shared](../shared.md)
- [Boundaries and patterns](../architecture/boundaries-and-patterns.md)
- [Architecture graphs](../architecture/graphs/README.md)
