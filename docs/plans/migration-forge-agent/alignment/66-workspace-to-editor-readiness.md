# Workspace To Editor Readiness

Purpose: define readiness criteria for turning current dialogue-forge workspaces into forge-agent-style editors with minimal rework.

## Canonical Direction

- `forge-agent` editor platform contracts are canonical.
- `dialogue-forge` validates migration slices and preserves richer narrative/gameplay features.

## Global Readiness Checklist

A workspace is editor-ready when all are true:

1. Data access is hook-based and package-owned (no adapter contexts).
2. Domain state is isolated from host app concerns.
3. Persistence contracts are explicit and documented in migration matrix (`65`).
4. UI composition can map to editor shell regions (header/toolbar/main/inspector/status/modals).
5. Domain APIs support non-breaking migration to canonical collection contracts.

## Forge Readiness

Status: mostly ready

- Strengths:
- hook-based data layer (`ForgePayloadProvider` + query/mutation hooks)
- strong yarn/game-state/graph domain features
- clear workspace store slices and commit flows

- Remaining:
- isolate any host-only affordances from package-level editor contract
- maintain collection parity mapping for graph/project fields

## Writer Readiness

Status: in transition

- Strengths:
- hook-based data layer and store wiring already in package
- lexical and narrative graph synchronization is mature

- Gaps to close:
- move from page-blob persistence to canonical `pages + blocks`
- persist reorder and block-level operations directly
- complete fallback strategy and cutover checkpoints for `bookBody`/`content`

## Characters Readiness

Status: medium

- Strengths:
- dedicated workspace and store
- clear domain boundaries

- Remaining:
- align contracts with editor platform shell and canonical data interfaces
- document migration path similar to Writer/Forge parity docs

## Theme Readiness

Status: medium-high

- Strengths:
- first-class package domain and host integration
- normalized settings/persistence patterns

- Remaining:
- formalize editor-style contract boundaries for future forge-agent parity where needed

## Future GamePlayer Readiness

Status: planned

- Needs:
- clear data contract inputs (graphs, flags, game states, pages/blocks where relevant)
- editor shell integration pattern
- migration plan alignment with gameplay/runtime docs

## Required Contracts (All Editorizable Workspaces)

1. Collection contract mapping documented in `65`.
2. Store ownership and side-effect boundaries documented.
3. Mutation/query hooks available for editor operations.
4. Explicit compatibility strategy for any legacy fields.

## Update Triggers

Update this doc when:

- a workspace changes persistence model
- a workspace reaches a new readiness stage
- editor platform contracts in forge-agent materially change

## Next Recommended Slices

1. Complete Writer block-first compatibility layer and fallback reads.
2. Add mapper tests and contract validation checks.
3. Extend this readiness matrix with explicit owner + target milestone per workspace.
