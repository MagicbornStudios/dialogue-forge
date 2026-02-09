# Agent Artifacts Index

Canonical index for agent-facing operational docs in this repo.

## Quick Start

1. `docs/agent-artifacts/core/STATUS.md`
2. `agents.md`
3. `docs/19-coding-agent-strategy.md`
4. Relevant package/domain `AGENTS.md`

## Core Artifacts

- `docs/agent-artifacts/core/STATUS.md` - current repo state, done log, in-progress, next work
- `docs/agent-artifacts/core/MIGRATION.md` - migration-to-forge-agent slice ledger
- `docs/agent-artifacts/core/decisions.md` - architecture decisions and rationale
- `docs/agent-artifacts/core/errors-and-attempts.md` - failure/fix log
- `docs/agent-artifacts/core/tool-usage.md` - search/navigation workflow
- `docs/agent-artifacts/core/task-registry.md` - initiative registry and quick picks
- `docs/agent-artifacts/core/task-breakdown-system.md` - tiered breakdown process
- `docs/agent-artifacts/core/technical-debt-roadmap.md` - technical debt backlog
- `docs/agent-artifacts/core/compacting-and-archiving.md` - artifact maintenance policy

## Governance Entrypoints

- `agents.md` - repo rules and boundaries
- `SKILLS.md` - capabilities contract
- `ISSUES.md` - known blockers and non-goals
- `CONTRIBUTING.md` - human workflow and DoD

## Package AGENTS

- `packages/shared/AGENTS.md`
- `packages/forge/AGENTS.md`
- `packages/writer/AGENTS.md`
- `packages/video/AGENTS.md` (if present)
- `packages/characters/AGENTS.md`
- `packages/theme/AGENTS.md`
- `packages/ai/AGENTS.md`

## Placement Rules

- Root docs are for entrypoints and policies.
- Living agent state belongs in `docs/agent-artifacts/core/`.
- Historical/superseded material belongs in `docs/agent-artifacts/archive/`.
- Migration and building docs belong in `docs/plans/migration-forge-agent/` (themed subfolders: strategy, forge, game-player, writer, alignment). Entry: [00-index.md](plans/migration-forge-agent/00-index.md).
