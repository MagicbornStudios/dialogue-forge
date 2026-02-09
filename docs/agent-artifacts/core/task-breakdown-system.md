# Task Breakdown System

Tiered breakdown model for execution planning.

## Tiers

- Tier 0: Initiative (large goal)
- Tier 1: Lane (theme/capability area)
- Tier 2: Slice (medium deliverable)
- Tier 3: Task (small, single PR)

## Required Fields

Each item should include:

- `id`
- `title`
- `parent` (except Tier 0)
- `tier`
- `impact` (Small/Medium/Large/Epic)
- `status` (`open`, `in_progress`, `done`)
- optional `reference`

## When To Create A Breakdown

Create a dedicated breakdown doc when:

- STATUS has a Large/Epic item, or
- Work spans schema + hooks + docs + migration artifacts.

## Workflow

1. Pick Tier 2/3 item from `task-registry.md`.
2. Set status to `in_progress`.
3. Execute and validate.
4. Set status to `done`.
5. Update `STATUS.md` Done log.

## Current Alignment Program Breakdown

- Initiative: `alignment-parity`
- Lanes:
- governance-entrypoints
- agent-artifacts-hardening
- collection-contract-parity
- workspace-editor-readiness
