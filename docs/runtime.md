# Runtime

## Overview
Runtime concerns cover how Forge graphs are executed, how flags and conditions are evaluated, and how playback surfaces are rendered for simulation inside the Forge workspace.

## Tech Stack
Runtime execution is TypeScript-first and tightly coupled to Forge graph types:
- **Forge runtime engine** (`src/forge/runtime/engine/`) for execution and frame emission.
- **Forge graph + flag types** for input and output contracts.
- **GamePlayer UI** for rendering runtime playback.

## Execution Engine
Runtime execution is implemented in `src/forge/runtime/engine/execute-graph-to-frames.ts`:
- **Inputs**: `ForgeGraphDoc` and the current `ForgeGameState` (flags + state).
- **Condition evaluation**: Conditions use `CONDITION_OPERATOR` to evaluate flag values (set, equals, greater-than, etc.).
- **Frames**: The executor emits a sequence of runtime frames while applying flag mutations and resolving directives.

See the engine for the concrete condition evaluation logic and frame execution loop.

A convenience export is exposed via `src/forge/runtime/execute-graph-to-frames.ts` so external callers can import `executeGraphToFrames` without depending on the engine internals.

## How It Looks
Runtime playback inside Forge uses the `GamePlayer` component, which provides a stage-like container for dialogue simulation during authoring.

## When to Edit Runtime Code
- **New runtime behaviors** (scene/media directives, frame rendering, runtime tuning) → edit the engine in `src/forge/runtime/engine/`.
- **Playback UI** (what users see during test runs) → edit `GamePlayer` or related UI in `src/forge/components/ForgeWorkspace/components/GamePlayer/`.

## Architecture Graphs
The latest generated dependency graphs and reports live in:
- `docs/architecture/graphs/dependency-cruiser.mmd` (Mermaid)
- `docs/architecture/graphs/dependency-cruiser.d2` (D2)
- `docs/architecture/graphs/madge.json` (Madge dependency map)
- `docs/architecture/dependency-cruiser.json` (raw cruise output)
- `docs/architecture/latest-analysis.md` (summary report)

## Related Docs
- [Forge Overview](./forge.md)
- [Dialogue Nodes & Editors](./nodes-and-editors.md)
- [Architecture Graphs](./architecture/graphs/README.md)
