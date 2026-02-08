---
title: 05 - Building a workspace
created: 2026-02-08
updated: 2026-02-08
---

# 05 - Building a workspace

## What

Build or adapt workspace surfaces in Dialogue Forge while staying compatible with the architecture used in `forge-agent`.

## Prerequisites

- Read `docs/architecture/workspace-editor-architecture.md`.
- Read domain AGENTS file before editing any domain package.

## Steps

1. Keep persistent state in workspace stores, ephemeral state in session stores.
2. Do not introduce draft slices or event buses.
3. Prefer adapter contracts and explicit actions.
4. Validate the slice in this repo; upstream stable behavior to `forge-agent`.

## Related

- `docs/how-to/building-a-workspace.md`
- `docs/plans/migration-forge-agent/01-agent-strategy-migration.md`
