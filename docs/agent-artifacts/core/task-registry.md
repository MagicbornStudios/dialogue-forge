# Task Registry

Single entrypoint for pickable work.

## Initiatives (Tier 0)

| id | title | impact | status | reference |
|---|---|---|---|---|
| alignment-parity | Dialogue-forge parity with forge-agent strategy/docs | Large | in_progress | docs/19-coding-agent-strategy.md |
| writer-blocks-transition | Non-breaking Writer pages->blocks transition | Large | in_progress | docs/plans/migration-forge-agent/writer/63-writer-pages-blocks-and-reorder.md |
| workspace-editor-readiness | Workspace->editor readiness and migration guardrails | Medium | open | docs/plans/migration-forge-agent/alignment/66-workspace-to-editor-readiness.md |
| yarn-and-gameplay-continuity | Preserve yarn/game-state/player strengths during migration | Medium | open | docs/plans/migration-forge-agent/game-player/50-game-state-and-player.md |

## Quick Picks (Tier 2/3)

| id | title | parent | impact | status |
|---|---|---|---|---|
| align-docs-entrypoints | Keep root/docs entrypoints in sync | alignment-parity | Small | open |
| maintain-collection-matrix | Update 65 matrix after schema changes | writer-blocks-transition | Small | open |
| add-block-mapper-tests | Add and maintain legacy<->canonical mapper tests | writer-blocks-transition | Medium | open |
| verify-agent-links | Check core artifact links from 18-index | alignment-parity | Small | open |

## Usage

- Choose one open Tier 2/3 item when possible.
- Mark in-progress in this file and `STATUS` when starting.
- Move to done and record completion in `STATUS` when finished.
