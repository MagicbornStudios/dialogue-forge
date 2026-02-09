# Forge

## Overview
Forge is the visual graph editor for narrative/storylet authoring. It owns:

- graph editing UI/state,
- Yarn import/export utilities,
- game-state aware execution utilities,
- in-workspace play flow via the new player composition path.

## Core surfaces

- Workspace shell: `packages/forge/src/components/ForgeWorkspace/ForgeWorkspace.tsx`
- Graph editors: `.../ForgeNarrativeGraphEditor` and `.../ForgeStoryletGraphEditor`
- Data hooks: `packages/forge/src/data/forge-queries.ts`
- Yarn conversion: `packages/forge/src/lib/yarn-converter/`
- Game player runtime: `packages/forge/src/lib/game-player/`
- Game player UI: `packages/forge/src/components/GamePlayer/`

## Data and runtime flow

1. Forge reads project/graph/state via package hooks and shared payload provider.
2. Play action requests server composition (`/api/forge/player/composition`) or local fallback.
3. Composition is rendered in `GamePlayer`:
   - Pixi'VN shell for canvas scene layer.
   - React overlay for dialogue text, choices, controls.
4. Runner events update variable storage, choices, and line output.

## Invariants

- Keep Forge package host-agnostic (no `apps/studio` imports).
- Use shared constants for discriminators.
- No draft slice/event bus patterns in new work.
- Keep player execution graph-first; Yarn is export portability, not runtime VM.

## Related docs

- `docs/architecture/workspace-editor-architecture.md`
- `docs/domains/runtime.md`
- `docs/plans/migration-forge-agent/game-player/50-game-state-and-player.md`
- `docs/plans/migration-forge-agent/game-player/67-pixivn-composition-contract-and-adapter.md`
