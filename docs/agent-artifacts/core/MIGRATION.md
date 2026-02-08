# Migration to forge-agent

Living artifact for migration work. **When doing migration:** read [docs/plans/migration-forge-agent/00-index.md](../../plans/migration-forge-agent/00-index.md) and the relevant plan first; after each slice, update the plan and add a one-line "Done" below.

## Purpose

Migrate Writer and ForgeWorkspace nodes and Yarn implementation from this repo (dialogue-forge) into forge-agent. Do not migrate edge-drop (see [11-out-of-scope.md](../../plans/migration-forge-agent/11-out-of-scope.md)).

## Ralph Wiggum loop

1. Read STATUS (or this file), [00-index](../../plans/migration-forge-agent/00-index.md), and the target plan (30–33).
2. Do one slice (e.g. one node type, one Yarn handler).
3. Update the plan's Done list and Next section; add a "Done" line here.

## Done

- 2026-02-08: Replaced Forge/Writer adapter-context data flow with package-owned React Query hooks plus shared payload client provider in the host.

## Links

- [Migration plans index](../../plans/migration-forge-agent/00-index.md)
- [Agent strategy for migration](../../plans/migration-forge-agent/01-agent-strategy-migration.md)
- [Out of scope (edge-drop)](../../plans/migration-forge-agent/11-out-of-scope.md)
