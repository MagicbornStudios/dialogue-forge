# Agent strategy for migration

How agents use the migration plans and keep them up to date. This folder is the canonical place for migration state; no duplicate "for agents" copies elsewhere.

## Ralph Wiggum loop for plans and documentation

1. **Before a migration slice**
   - Read [00-index.md](../00-index.md), the specific plan (for example [31-plan-nodes-and-inspector.md](../forge/31-plan-nodes-and-inspector.md)), and [docs/agent-artifacts/core/STATUS.md](../../../agent-artifacts/core/STATUS.md) or [MIGRATION.md](../../../agent-artifacts/core/MIGRATION.md).
   - Check [11-out-of-scope.md](11-out-of-scope.md) so edge-drop is not reintroduced.
   - Understand the "Next" or "Next slice" in the plan.

2. **Execute one slice**
   - Do one concrete unit of work (for example "Add Character node type and CharacterNodeFields to forge-agent inspector").
   - Code changes for migration happen in **forge-agent**. This repo holds docs and plans.

3. **After the slice**
   - Update the plan's **Done** list and **Next** section.
   - Update [00-index.md](../00-index.md) if you added a new plan or doc.
   - Update [docs/agent-artifacts/core/MIGRATION.md](../../../agent-artifacts/core/MIGRATION.md) (or migration section in STATUS) with a one-line "Done: ...".

4. **Scope**
   - Edits in **dialogue-forge** are docs and plans in this folder (and agent-artifacts) unless a plan explicitly says otherwise.
   - Actual migration implementation is in **forge-agent**.

## What counts as one slice

- One node type plus its inspector fields.
- One Yarn handler ported.
- One plan subsection completed.
- One chrome piece completed without edge-drop.

Keep slices small and reviewable so the Done list stays accurate and the next agent can pick up cleanly.

## Consumer playground strategy

Use Dialogue Forge as a consumer and experimental playground for publisher patterns in `forge-agent`:

1. Read and align with `../forge-agent` numbered docs first (especially 01, 05, 20, 24, 25).
2. Validate integration behavior here (`@forge/dev-kit` install flow, vendor wiring, AI experiments).
3. Keep experiments small and explicit, then upstream stable patterns back to `forge-agent`.
4. Update this repo docs when publisher conventions change so agents can recover context quickly.
5. Treat `packages/theme` + Studio ThemeWorkspace as the canonical place for theme-generation experiments; keep `vendor/tweakcn` reference-only.

## When in doubt

- Prefer updating the plan with `Open:` or `Blocked:` notes rather than leaving state ambiguous.
- Do not migrate edge-drop; see [11-out-of-scope.md](11-out-of-scope.md).
- Link plans to [docs/architecture/dialogue-domain-and-yarn.md](../../../architecture/dialogue-domain-and-yarn.md) and [docs/architecture/writer-workspace-architecture.md](../../../architecture/writer-workspace-architecture.md) for source-of-truth behavior.
