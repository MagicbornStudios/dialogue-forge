# Runtime

## Overview
Runtime concerns cover how Forge graphs are executed, how flags and conditions are evaluated, and how playback surfaces are rendered for simulation inside the Forge workspace.

## Tech Stack
Runtime execution is TypeScript-first and tightly coupled to Forge graph types:
- **Forge runtime engine** (`packages/runtime/src/engine/`) for execution and frame emission.
- **Forge graph + flag types** for input and output contracts.
- **GamePlayer UI** for rendering runtime playback.

## Execution Engine
Runtime execution is implemented in `packages/runtime/src/engine/execute-graph-to-frames.ts`:
- **Inputs**: `ForgeGraphDoc` and the current `ForgeGameState` (flags + state).
- **Condition evaluation**: Conditions use `CONDITION_OPERATOR` to evaluate flag values (set, equals, greater-than, etc.).
- **Frames**: The executor emits a sequence of runtime frames while applying flag mutations and resolving directives.

See the engine for the concrete condition evaluation logic and frame execution loop.

A convenience export is exposed via `packages/runtime/src/execute-graph-to-frames.ts` so external callers can import `executeGraphToFrames` without depending on the engine internals.

## How It Looks
Runtime playback inside Forge uses the `GamePlayer` component, which provides a stage-like container for dialogue simulation during authoring.

## Manual Runtime Verification Checklist
Use the **Manual Playback Fixture** graph to confirm the dialogue UI and Remotion preview stay in sync. The fixture lives in `packages/runtime/src/__tests__/fixtures/manual-playback-graph.ts` so it can be reused in tests and as a manual QA reference.

### Setup
1. Start the app locally (`npm run dev`) and open `/forge`.
2. In your Demo Project (or any project), create a new narrative graph named **Manual Playback Fixture**.
3. Use `packages/runtime/src/__tests__/fixtures/manual-playback-graph.ts` as the reference for the node content, choices, and wiring.
4. Switch to the **Play** tab.
5. In the template dropdown, pick the **Dialogue Only** video template preset (starter template).

### Checklist (manual)
- ✅ **Initial frame renders**: The dialogue panel shows the Guide speaker and the intro line from the fixture.
- ✅ **Choices render**: Two choices appear in the choice list.
- ✅ **Dialogue updates on choice**: Clicking either choice updates the dialogue text to the outro line.
- ✅ **Remotion Player updates**: The Remotion preview updates to reflect the newly selected line (speaker + dialogue).
- ✅ **Completion state**: The choices panel transitions to “Dialogue complete.” after the outro line.

If any step fails, re-check the fixture data and verify that the video template preset is selected so that the Remotion Player can compile frames.

## When to Edit Runtime Code
- **New runtime behaviors** (scene/media directives, frame rendering, runtime tuning) → edit the engine in `packages/runtime/src/engine/`.
- **Playback UI** (what users see during test runs) → edit `GamePlayer` or related UI in `packages/forge/src/components/ForgeWorkspace/components/GamePlayer/`.

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

