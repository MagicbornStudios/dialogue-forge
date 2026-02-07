# Writer workspace architecture

Writer is the narrative prose workspace: acts, chapters, pages, and a Lexical-based editor with AI assistance. This doc is for reimplementation.

## Role

- Organize story structure (acts, chapters, pages) and edit prose.
- Sync with Forge narrative graph: Writer's hierarchy (acts/chapters/pages) can map to narrative graph nodes; narrative graph is loaded/updated via WriterForgeDataAdapter.
- AI patch workflow: CopilotKit-driven edits expressed as WriterPatchOp (replace/splice/replace-block); editor can apply or preview.

## Store

Location: `packages/writer/src/components/WriterWorkspace/store/writer-workspace-store.tsx`.

**Slices:**
- **content** — Acts, chapters, pages; active page.
- **navigation** — Selection and tree state for sidebar.
- **editor** — Editor instance state (e.g. Lexical).
- **ai** — AI proposals, preview meta, selection ranges, error status (WriterAiProposalStatus, WriterAiPreviewMeta).
- **draft** — Draft graph (narrative) and deltas; commit creates pages and updates graph via adapter.
- **viewState** — Modal and UI visibility.
- **subscriptions** — React to project/pages load; sync narrative graph and pages.

No event bus. Mutations via explicit actions. Draft slice is used for narrative graph + pending page creations; commit uses `buildOnCommitWriterDraft(dataAdapter, forgeDataAdapter)` which creates pages then calls `forgeDataAdapter.updateGraph`.

## Data flow and adapters

- **WriterDataAdapter** — Pages CRUD: createPage, updatePage, list pages (scoped by project/narrative).
- **WriterForgeDataAdapter** — Narrative graph: getGraph, createGraph, updateGraph. Used to load/save the narrative graph that backs the act/chapter/page structure.
- **WriterDataContext** / **ForgeDataContext** — Provide adapters to the workspace. Host or parent can pass `dataAdapter` and `forgeDataAdapter` props; otherwise context is used.
- **setupWriterWorkspaceSubscriptions** — On project change, load pages and narrative graph; set initial active page; keep store in sync with adapter data.

## Layout

- **WriterLayout** — Wraps sidebar + editor pane + top bar.
- **WriterTree** (sidebar) — Acts/chapters/pages tree; WriterTreeRow per node; expand/collapse, selection, open page.
- **WriterEditorPane** — Lexical-based editing surface (under `editor/`); block-level editing, sync with workspace store.
- **WriterTopBar** / **topBar** prop — Optional top bar (e.g. project switcher). WriterProjectSwitcher lives in layout.
- **WriterWorkspaceModalsRenderer** — Modals (e.g. WriterYarnModal).

## Editor

- **Lexical** for rich text and content blocks.
- Editor lives under `packages/writer/src/components/WriterWorkspace/editor/` (WriterEditorPane, plugins, block types).
- Sync: workspace store actions update content; editor state is synced with store (avoid infinite loops in sync plugins).
- Autosave: debounced; explicit save flow.

## AI patch workflow

- **WriterPatchOp** — Replace, splice, or replace-block operations.
- Store tracks AI proposal status, preview meta, and selection. Editor can apply or preview patches.
- CopilotKit integrates via provider and actions; OpenRouter (or similar) for model routing.

## Modals

- **WriterYarnModal** — View/export Yarn for the narrative graph (if wired). Other modals as needed via viewState slice.

## Key files

- `WriterWorkspace.tsx` — Shell; creates store with callbacks (updatePage, createPage, getNarrativeGraph, createNarrativeGraph, onCommitWriterDraft); runs subscriptions; renders WriterLayout, WriterTree, WriterEditorPane, WriterWorkspaceModalsRenderer.
- `store/slices/content.slice.ts`, `navigation.slice.ts`, `editor.slice.ts`, `ai.slice.ts`, `draft.slice.ts`, `viewState.slice.ts`, `subscriptions.ts`.
- `layout/WriterLayout.tsx`, `WriterProjectSwitcher.tsx`, `WriterTopBar.tsx`.
- `sidebar/WriterTree.tsx`, `WriterTreeRow.tsx`.
- `editor/WriterEditorPane` and plugins under `editor/`.
- `modals/WriterWorkspaceModals.tsx`, `WriterYarnModal.tsx`.

## Workspace architecture alignment

- Workspace store = domain state (content, navigation, draft, viewState, ai).
- Editor session state can live in editor slice or Lexical internals.
- No draft slices in the “new” sense per workspace-editor-architecture: Writer keeps a draft slice for the narrative graph + pending page creations; commit is explicit via adapter.
- Adapters are contracts (WriterDataAdapter, WriterForgeDataAdapter); host implements and passes them in.
