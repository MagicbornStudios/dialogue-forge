# Dead code, monorepo tracking, doc consolidation, and unified workspace architecture

## Goals

- Remove all deprecated code (component export, helpers, wrappers); keep only contracts where needed.
- One living doc with **monorepo status inlined at the top** (no links for status — agent reads status first), then instruction: read AGENTS.md, then workspace/architecture docs for a **unified system**.
- Update docs/architecture/workspace-editor-architecture.md to the full guide (subscriptions, EventSink, draft slice, Video/Characters, anti-patterns, decision tree, file structure) as the single canonical workspace doc.
- Platform mindset: host app = platform; auth-gate Writer/Video/Forge when not logged in; pass client-side data between workspaces; keep data up to date and quick (Figma/Canva/Unity). Document this so future auth and cross-workspace work has a target.
- Agent loop (Ralph Wiggum): read status (living doc top) then read AGENTS.md then read workspace-editor-architecture (and any other arch docs) then do work then update status/docs. Few files, packages, reuse; high-level designer/architect lens.

---

## 1. Remove all deprecated code

**Remove entirely:**

- **src/video/index.ts** — Remove export of VideoTemplateWorkspace component after consumers migrate. Keep exporting contracts from video-template-workspace-contracts.ts (and any types used by host/PlayView).
- **src/video/workspace/VideoTemplateWorkspace.tsx** — Delete file after consumers migrate. For now it is a compatibility wrapper that forwards to Twick.
- **src/forge/lib/utils/forge-flow-helpers.ts** — Remove createGraphWithStartEnd (deprecated; no callers).
- **src/forge/lib/utils/layout/layout.ts** — Remove applyDagreLayout and applyHierarchicalLayout (deprecated; no callers). Keep applyLayout and resolveNodeCollisions export.

**No code change, note in living doc only:**

- src/shared/types/forge-graph.ts: speaker on node type is legacy (comment: deprecated, use characterId). Mention in living doc "Types: forge-graph node has legacy speaker; prefer characterId."

**AGENTS.md:** Fix sentence: legacy video workspace removed; point to Twick-only flow; remove or replace "Legacy components exist but should not be used (see VIDEO_ISSUES.md cleanup section)".

---

## 2. Living doc: status at the top (no links for status)

**Single living doc** (e.g. docs/STATUS.md or docs/ARCHITECTURE_AND_PROGRESS.md).

**At the very top — inlined, not linked:**

- **Monorepo status** — Phase 0: Done. Phase 1: Not started (no apps/ or packages/ in root package.json). Phases 2–4: Not started. Copy the short phases checklist here so the agent does not have to open another file for "where we are."
- **Decisions / errors / handoff** — Build: npm run build from root; path aliases in tsconfig and next.config. No cross-imports: src/** must not import app/** or app/payload-types.ts. Video: Twick-only; contracts in video-template-workspace-contracts; host implements adapters. Any other one-line decisions that prevent re-opening closed doors.

**Immediately after the inlined status:**

- **Agent loop.** Agent must: (1) Read this status doc first. (2) Read AGENTS.md. (3) Read workspace and architecture docs (especially docs/architecture/workspace-editor-architecture.md). (4) Do work. (5) Update this status doc and relevant docs so the next agent has context.
- **What to do next** (short list): e.g. continue monorepo Phase 1 when ready; apply workspace architecture consistently; auth-gate workspaces (future).
- **What's been done recently**: styling cleanup, legacy video removed, deprecated code removed, this living doc and workspace doc updated.

Do not put "link to monorepo.md and monorepo-migration.md" as the primary way to see status — the status is at the top. Those files remain canonical for full migration detail; the living doc can mention them for deep dives.

---

## 3. Unified workspace architecture doc

**Replace/update** docs/architecture/workspace-editor-architecture.md with the full Workspace Editor Architecture Guide (subscriptions, EventSink, draft/commit, contracts, session store, editor shell, command pattern, modal management, auto-save, slice organization, communication and subscription flow, anti-patterns including subscription cleanup, decision tree, file structure reference, domain-specific notes for Forge, Writer, Video, Characters).

**Add a short "Platform and host" subsection:**

- Host app is the **platform**: it provides Forge, Writer, Video (and Characters) as tools. When we have users, unauthenticated users must not access these workspaces (auth gate).
- Data: pass client-side data between workspaces and keep it up to date and quick (Figma/Canva/Unity-like). Workspace contracts and a future platform-level session or context can support this; document as target for future work.

This doc is the **unified** reference for all workspaces so agents read one place for editor/shell/store/contract patterns.

---

## 4. AGENTS.md and agent loop

- In **Development Tracking** / **Always Review Before Working**: "Read **docs/STATUS.md** (or chosen name) first — it contains current monorepo status and handoff at the top. Then read this file (AGENTS.md), then docs/architecture/workspace-editor-architecture.md (and any other architecture docs for the area you're working in)."
- Do not rely on links to monorepo.md / monorepo-migration.md for "what phase we're in"; that lives in the status doc. Keep AGENTS.md as the primary coding and domain rules; status doc as the first read for context and progress.

---

## 5. Implementation order (for next agent)

1. **Living doc** — Create docs/STATUS.md (or ARCHITECTURE_AND_PROGRESS.md) with inlined monorepo status + decisions/errors at top, then agent loop, then "what to do next" and "what's been done."
2. **Workspace architecture** — Update docs/architecture/workspace-editor-architecture.md to the full guide (subscriptions, EventSink, draft, Video/Characters, anti-patterns, decision tree, file structure, platform/host subsection).
3. **AGENTS.md** — Point to status doc first, then AGENTS.md, then workspace-editor-architecture; fix video legacy sentence.
4. **Remove deprecated code** — Remove VideoTemplateWorkspace export and delete VideoTemplateWorkspace.tsx; remove createGraphWithStartEnd; remove applyDagreLayout and applyHierarchicalLayout; add optional living-doc note for forge-graph speaker.
5. **Mark Phase 0 done** in docs/plans/monorepo-migration.md.
6. **Run build** once at the end to confirm no regressions.

---

## 6. Agent loop (what the next agent reads)

1. **docs/STATUS.md** (or chosen name) — status at top, then loop instructions.
2. **AGENTS.md** — project and coding rules.
3. **docs/architecture/workspace-editor-architecture.md** — unified workspace patterns (and any other architecture docs for the workspace/domain in question).
4. Do work; update STATUS and relevant docs so the next agent has context.
