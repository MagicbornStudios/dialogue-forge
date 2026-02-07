# Agent strategy for migration

How agents use the migration plans and keep them up to date. This folder is the canonical place for migration state; no duplicate “for agents” copies elsewhere.

## Ralph Wiggum loop for plans and documentation

1. **Before a migration slice**
   - Read [00-index.md](00-index.md), the specific plan (e.g. [31-plan-nodes-and-inspector.md](31-plan-nodes-and-inspector.md)), and [docs/agent-artifacts/core/STATUS.md](../../agent-artifacts/core/STATUS.md) or [MIGRATION.md](../../agent-artifacts/core/MIGRATION.md).
   - Check [11-out-of-scope.md](11-out-of-scope.md) so edge-drop is not reintroduced.
   - Understand the “Next” or “Next slice” in the plan.

2. **Execute one slice**
   - Do one concrete unit of work (e.g. “Add Character node type and CharacterNodeFields to forge-agent inspector,” or “Port character-handler and player-handler to forge-agent”).
   - Code changes for migration happen in **forge-agent**. This repo holds only docs and plans.

3. **After the slice**
   - Update the plan’s **Done** list and **Next** section.
   - Update [00-index.md](00-index.md) if you added a new plan or doc.
   - Update [docs/agent-artifacts/core/MIGRATION.md](../../agent-artifacts/core/MIGRATION.md) (or the Migration section in STATUS) with a one-line “Done: …” so other agents see progress.

4. **Scope**
   - Edits in **dialogue-forge** are to docs and plans in this folder (and agent-artifacts) only.
   - Actual implementation is in **forge-agent**.

## What counts as one slice

- One node type (e.g. CHARACTER) plus its inspector fields.
- One Yarn handler (e.g. character-handler) ported.
- One plan subsection (e.g. “Wire createWorkspaceContext(store) for storylet inlining”).
- One chrome piece (e.g. node palette without edge-drop).

Keep slices small and reviewable so the Done list stays accurate and the next agent can pick up cleanly.

## When in doubt

- Prefer updating the plan with “Open: …” or “Blocked: …” rather than leaving state ambiguous.
- Do not migrate edge-drop; see [11-out-of-scope.md](11-out-of-scope.md).
- Link from plans to [docs/architecture/dialogue-domain-and-yarn.md](../../architecture/dialogue-domain-and-yarn.md) and [docs/architecture/writer-workspace-architecture.md](../../architecture/writer-workspace-architecture.md) for source-of-truth behavior.
