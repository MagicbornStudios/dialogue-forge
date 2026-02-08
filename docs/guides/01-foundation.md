---
title: 01 - Foundation
created: 2026-02-08
updated: 2026-02-08
---

# 01 - Foundation

## What

Dialogue Forge is a consumer/playground repo aligned to `forge-agent` (publisher of `@forge/dev-kit` and related packages).

## Prerequisites

- Read `docs/agent-artifacts/core/STATUS.md`.
- Read `AGENTS.md` at repo root.
- Read `docs/architecture/workspace-editor-architecture.md`.
- Keep `../forge-agent` available locally for reference when touching registry, vendoring, or AI runtime wiring.

## Steps

1. Treat `forge-agent` docs as the source of truth for publisher workflows.
2. Use this repo to validate consumer integration (`@forge/dev-kit`) and experimental features before upstreaming.
3. Keep boundaries enforced here (`packages/**` never imports from app code).

## Related

- `docs/guides/05-building-a-workspace.md`
- `docs/guides/15-install-from-local-registry.md`
- `docs/plans/migration-forge-agent/00-index.md`
