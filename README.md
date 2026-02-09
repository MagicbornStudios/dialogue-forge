# Dialogue Forge

Dialogue Forge is the consumer/playground monorepo used to validate workspace/editor patterns before upstreaming stable slices to `../forge-agent`.

## Quick Start

1. Install dependencies
```bash
pnpm install
```
2. Run Studio
```bash
pnpm dev
```
3. Open `http://localhost:3000`

## Core Commands

```bash
pnpm run typecheck:domains
pnpm run typecheck:studio
pnpm run test
pnpm payload:generate
```

## Repo Role

- `forge-agent` is the canonical target for long-term editor platform contracts.
- This repo is the migration playground where we preserve richer narrative/yarn/game-state behavior while aligning contracts.

## Documentation Entry Points

- Human and contributor index: `docs/00-docs-index.md`
- Agent artifacts index: `docs/18-agent-artifacts-index.md`
- Coding agent strategy: `docs/19-coding-agent-strategy.md`
- Migration plans: `docs/plans/migration-forge-agent/00-index.md`

## Governance Docs

- Rules and boundaries: `agents.md`
- Capabilities contract: `SKILLS.md`
- Known blockers/issues: `ISSUES.md`
- Contribution workflow: `CONTRIBUTING.md`
- PR checklist: `.github/pull_request_template.md`
