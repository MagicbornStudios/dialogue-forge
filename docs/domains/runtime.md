# Runtime

## Overview
Runtime now includes a first graph-first player slice in Forge:

- Shared runtime + composition contracts in `packages/shared/src/types/runtime.ts` and `packages/shared/src/types/composition.ts`.
- Graph execution and variable handling in `packages/forge/src/lib/game-player/`.
- Play surface (`GamePlayer`) and Forge modal integration for in-editor playback.

Yarn export remains supported and is still independent from player execution.

## Current state

- **Execution model:** direct graph runner (no Yarn VM/WASM).
- **Variable model:** flattened Yarn-compatible variables (`boolean | number | string`), with player path preserving numeric zero values.
- **Composition model:** `ForgeCompositionV1`, generated on demand from graph + resolver.
- **Server route:** `POST /api/forge/player/composition`.
- **UI:** Forge Play modal with Pixi'VN shell + React overlay controls.

## Where to edit

- Runtime constants/directives: `packages/shared/src/types/runtime.ts`
- Composition contract: `packages/shared/src/types/composition.ts`
- Runner/storage/adapter logic: `packages/forge/src/lib/game-player/`
- Workspace player wiring: `packages/forge/src/components/ForgeWorkspace/`
- Studio server composition route: `apps/studio/app/api/forge/player/composition/route.ts`

## Related docs

- `docs/plans/migration-forge-agent/game-player/50-game-state-and-player.md`
- `docs/plans/migration-forge-agent/game-player/64-game-player-tech-design-and-roadmap.md`
- `docs/plans/migration-forge-agent/game-player/67-pixivn-composition-contract-and-adapter.md`
