# Migration to forge-agent

Living artifact for migration work. **When doing migration:** read [docs/plans/migration-forge-agent/00-index.md](../../plans/migration-forge-agent/00-index.md) and the relevant plan first; after each slice, update the plan and add a one-line "Done" below.

## Purpose

Migrate Writer and ForgeWorkspace nodes and Yarn implementation from this repo (dialogue-forge) into forge-agent. Do not migrate edge-drop (see [11-out-of-scope.md](../../plans/migration-forge-agent/strategy/11-out-of-scope.md)).

## Ralph Wiggum loop

1. Read STATUS (or this file), [00-index](../../plans/migration-forge-agent/00-index.md), and the target plan (30–33).
2. Do one slice (e.g. one node type, one Yarn handler).
3. Update the plan's Done list and Next section; add a "Done" line here.

## Done

- 2026-02-09: Added first Pixi'VN player MVP slice in dialogue-forge (shared composition contract, graph runner/storage, server composition route, Forge play modal wiring, and targeted runtime tests).
- 2026-02-08: Replaced Forge/Writer adapter-context data flow with package-owned React Query hooks plus shared payload client provider in the host.
- 2026-02-09: Added Writer docs slice for Notion SDK page/block migration and persisted block reorder (new 63 + linked updates in 00/60/61/62/32).
- 2026-02-09: Added non-breaking Writer block compatibility path (`blocks` collection wiring, block CRUD/reorder hooks, legacy<->canonical mappers, and fallback read resolver).

## Links

- [Migration plans index](../../plans/migration-forge-agent/00-index.md)
- [Agent strategy for migration](../../plans/migration-forge-agent/strategy/01-agent-strategy-migration.md)
- [Out of scope (edge-drop)](../../plans/migration-forge-agent/strategy/11-out-of-scope.md)
