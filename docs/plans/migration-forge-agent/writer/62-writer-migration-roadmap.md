# Writer migration roadmap

Ordered phases for migrating the Writer workspace to the target codebase (e.g. forge-agent). Use alongside [54-migration-roadmap.md](54-migration-roadmap.md) (Forge) and [55-data-access-and-export.md](55-data-access-and-export.md) (data access).

## Purpose

- Order Writer work into phases: types/data, shell and store, tree and editor, AI patch, optional commenting and polish.
- Link each phase to Forge and data-access decisions so Writer can depend on them.
- Give implementers a single place for Writer migration order and context.

## What's next

- For Notion SDK page/block migration and persisted block reorder, execute tasks in [63-writer-pages-blocks-and-reorder.md](63-writer-pages-blocks-and-reorder.md).
- Pick the next uncompleted task from 63 and update 63 Done/Next after each slice.

## Dependencies

- **Forge:** Graph types and hooks (narrative graph, createGraph, updateGraph) should be in place or documented so Writer can use them. See [54-migration-roadmap.md](54-migration-roadmap.md) Phase 3.
- **Data access:** React Query + Payload (or equivalent), no adapters. See [55-data-access-and-export.md](55-data-access-and-export.md). Writer pages and narrative graph both use this model.

---

## Phase 1 — Types and data

**Outcome:** ForgePage (or equivalent) and page CRUD types; narrative graph types; React Query hooks for pages and narrative graph (or document that they mirror 55).

**Technical context:**

- [60-writer-features-and-requirements.md](60-writer-features-and-requirements.md) — Data access and dependencies.
- [55-data-access-and-export.md](55-data-access-and-export.md) — Hook pattern, Payload collection shape.
- [61-writer-current-implementation.md](61-writer-current-implementation.md) — writer-queries.ts, Forge hooks usage.
- Code: [packages/writer/src/data/writer-queries.ts](../../../packages/writer/src/data/writer-queries.ts), [packages/writer/src/data/writer-types.ts](../../../packages/writer/src/data/writer-types.ts); shared narrative types.

**Decisions / caveats:**

- Pages: list by project (and optionally narrative graph for current product). No adapter; hooks only.
- Narrative graph: use Forge graph hooks (useForgeGraphs, useForgeGraph, useCreateForgeGraph, useUpdateForgeGraph).

---

## Phase 2 — Workspace shell and store

**Outcome:** WriterWorkspace shell; store with content, navigation, editor, draft, viewState slices; subscriptions (load pages, load narrative graph, hierarchy); commit flow (buildOnCommitWriterDraft(api), createNarrativeGraph(api)).

**Technical context:**

- [61-writer-current-implementation.md](61-writer-current-implementation.md) — Store composition, subscriptions, callbacks.
- [32-plan-writer-and-pages.md](32-plan-writer-and-pages.md) — Writer editor mapping; no link to narrative graph.
- Code: [writer-workspace-store.tsx](../../../packages/writer/src/components/WriterWorkspace/store/writer-workspace-store.tsx), [subscriptions.ts](../../../packages/writer/src/components/WriterWorkspace/store/slices/subscriptions.ts), [narrative-graph-sync.ts](../../../packages/writer/src/lib/sync/narrative-graph-sync.ts).

**Decisions / caveats:**

- Callbacks (createPage, updatePage, getNarrativeGraph, createNarrativeGraph, onCommitWriterDraft) are built from hooks in the shell and passed via getCallbacks(). No adapter context.
- Hierarchy is derived from narrative graph + pages (extractNarrativeHierarchySync) in subscriptions.

---

## Phase 3 — Tree and editor

**Outcome:** WriterLayout, WriterTree, WriterEditorPane; Lexical editor with minimal plugin set (e.g. AutosavePlugin, basic formatting); page title and content load/save.

**Technical context:**

- [60-writer-features-and-requirements.md](60-writer-features-and-requirements.md) — Hierarchy and pages, editor requirements.
- [61-writer-current-implementation.md](61-writer-current-implementation.md) — UI components and plugin list.
- Code: [WriterLayout.tsx](../../../packages/writer/src/components/WriterWorkspace/layout/WriterLayout.tsx), [WriterTree.tsx](../../../packages/writer/src/components/WriterWorkspace/sidebar/WriterTree.tsx), [WriterEditorPane.tsx](../../../packages/writer/src/components/WriterWorkspace/editor/WriterEditorPane.tsx), [editor/lexical/plugins/](../../../packages/writer/src/components/WriterWorkspace/editor/lexical/plugins/).

**Decisions / caveats:**

- Port minimal Lexical plugin set first; expand (DraggableBlockPlugin, tables, etc.) in later phase if needed.
- Autosave debounced; title and content persisted via updatePage mutation.

---

## Phase 3b — Notion SDK, rebuilt collections, and block reorder

**Outcome:** Writer uses Notion SDK-aligned page/block schema; `bookBody` and `content` are no longer canonical; block-level storage is authoritative; Lexical syncs to blocks; drag-and-drop reorder is persisted.

**Technical context:**

- [63-writer-pages-blocks-and-reorder.md](63-writer-pages-blocks-and-reorder.md) — Design, data model, and ordered task list.
- [60-writer-features-and-requirements.md](60-writer-features-and-requirements.md) — Requirement-level expectations for pages, blocks, and editor behavior.
- [61-writer-current-implementation.md](61-writer-current-implementation.md) — Current page-blob persistence and editor save path.

**Dependencies:**

- Phase 3 shell/tree/editor baseline in place.
- React Query + Payload data-access model from [55-data-access-and-export.md](55-data-access-and-export.md).

**Decisions / caveats:**

- Implement in `dialogue-forge` first, then upstream stable patterns to `forge-agent`.
- Keep Notion object shape as contract; backend remains Payload unless explicitly changed.

---

## Phase 4 — AI patch workflow

**Outcome:** WriterPatchOp types; proposal state and preview; apply in editor; CopilotKit (or equivalent) integration.

**Technical context:**

- [60-writer-features-and-requirements.md](60-writer-features-and-requirements.md) — AI patch (WriterPatchOp ops).
- [61-writer-current-implementation.md](61-writer-current-implementation.md) — ai slice, writer-ai-types.
- Code: [writer-ai-types.ts](../../../packages/writer/src/types/writer-ai-types.ts), [ai.slice.ts](../../../packages/writer/src/components/WriterWorkspace/store/slices/ai.slice.ts); CopilotKit integration in writer/copilotkit or equivalent.

**Decisions / caveats:**

- Ops: setTitle, replaceSelectedText, insertParagraphAfterBlock, replaceBlockText, deleteBlock. Proposal state: idle/loading/ready/error. Preview and apply in editor.

---

## Phase 5 — Optional and polish

**Outcome:** Commenting (if in scope); WriterYarnModal; project switcher; full or documented subset of Lexical plugins.

**Technical context:**

- [60-writer-features-and-requirements.md](60-writer-features-and-requirements.md) — Commenting (optional), modals and chrome.
- [61-writer-current-implementation.md](61-writer-current-implementation.md) — CommentPlugin, WriterYarnModal, WriterProjectSwitcher.
- Code: [CommentPlugin](../../../packages/writer/src/components/WriterWorkspace/editor/lexical/plugins/CommentPlugin/), [WriterYarnModal.tsx](../../../packages/writer/src/components/WriterWorkspace/modals/components/WriterYarnModal.tsx).

**Decisions / caveats:**

- Commenting optional for MVP. Yarn modal shows narrative export/preview; project switcher and top bar complete chrome.

---

## Doc index (quick links)

| Doc | Content |
|-----|---------|
| [21](21-writer-forge-inventory.md) | Writer inventory, data flow (hooks), current implementation pointers |
| [32](32-plan-writer-and-pages.md) | Writer and pages; Notion vs narrative; features checklist |
| [55](55-data-access-and-export.md) | Data access (React Query, Payload), no adapters |
| [54](54-migration-roadmap.md) | Forge migration phases |
| [60](60-writer-features-and-requirements.md) | Writer features and requirements |
| [61](61-writer-current-implementation.md) | Writer current implementation map |
| [63](63-writer-pages-blocks-and-reorder.md) | Notion SDK page/block migration design and "what's next" task list |
