# Coding Agent Strategy

This is the operating strategy for coding agents in `dialogue-forge`.

## Slice Loop (Ralph Wiggum)

1. Read `docs/agent-artifacts/core/STATUS.md`.
2. Read `agents.md` and relevant domain AGENTS docs.
3. Pick one small slice from `STATUS` or `task-registry`.
4. Implement and validate.
5. Update `STATUS` and related artifacts (`decisions`, `errors-and-attempts`, `MIGRATION` when applicable).

## Before You Edit

- Confirm current state in STATUS and known blockers in `ISSUES.md`.
- Check `errors-and-attempts.md` to avoid repeating known failures.
- Search first with `rg`; then read the exact files before editing.

## After You Edit

- Record what was done in STATUS (Done log and/or in-progress transitions).
- Add/update decisions for architectural choices.
- Add failure/fix notes if any time-wasting issue was discovered.
- Keep migration plans/docs aligned when touching migration work.

## Task Selection Model

- High-level work items live in `STATUS.md` (impact-labeled).
- Granular work uses `task-registry.md` + breakdown docs.
- Prefer one reviewable slice per change set.

## Doc Placement Rules

- Root (`README`, `agents.md`, `SKILLS.md`, `ISSUES.md`, `CONTRIBUTING.md`) = entrypoints/policy.
- `docs/agent-artifacts/core/` = living operational state/history.
- `docs/plans/migration-forge-agent/` = migration and building docs (see 00-index; subfolders: strategy, forge, game-player, writer, alignment). For game player work, read game-player/50 and 64; decisions in agent-artifacts/core/decisions.md (ADR-006).
- `docs/agent-artifacts/archive/` = superseded snapshots.

## Alignment Rule

`forge-agent` is canonical for target editor-platform and collection contracts. This repo can innovate, but changes should be expressed as migration-compatible slices and upstreamed when stable.
