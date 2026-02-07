# Writer workspace walkthrough

Step-by-step view of the Writer workspace for reimplementation. For architecture, see [../architecture/writer-workspace-architecture.md](../architecture/writer-workspace-architecture.md).

## What Writer is

Writer is the narrative prose workspace: acts, chapters, and pages with a Lexical-based editor. It syncs with the Forge narrative graph (same hierarchy can back both). AI-assisted editing via CopilotKit and a patch workflow (WriterPatchOp).

## Layout

- **Top bar** — Optional; often project switcher (WriterProjectSwitcher). Can be passed as `topBar` prop.
- **Sidebar (tree)** — Acts → chapters → pages. Expand/collapse, select, open a page for editing. WriterTree + WriterTreeRow.
- **Editor pane** — Lexical editor for the active page. Block-level editing; content synced with workspace store. WriterEditorPane and plugins under `editor/`.
- **Modals** — WriterYarnModal (view/export Yarn for narrative graph if wired); others as needed.

## Typical flow

1. **Open Writer** — Workspace mounts. Project can be passed as `projectId` or from context. Subscriptions load pages and narrative graph for the project; store gets initial pages and active page.
2. **Switch project** — If project changes (e.g. project switcher), subscriptions reload pages and narrative graph; active page may reset or preserve depending on implementation.
3. **Navigate tree** — Expand acts/chapters; click a page to open it. Active page drives what the editor shows.
4. **Edit page** — Editor pane shows Lexical content for the active page. Edit blocks; changes sync to store. Autosave (debounced) persists via adapter (updatePage).
5. **Use AI (Copilot)** — CopilotKit provides suggestions. AI patch workflow: proposals as WriterPatchOp; store tracks proposal status and preview; editor can apply or preview. See architecture doc for WriterPatchOp and AI slice.
6. **Create structure** — Create act/chapter/page via store actions and adapter (createPage). Draft slice can track pending page creations; commit creates pages and updates narrative graph via forgeDataAdapter.updateGraph.
7. **Yarn modal** — If open, view or export Yarn for the narrative graph (same graph that backs the act/chapter/page structure).

## Data and adapters

- **WriterDataAdapter** — createPage, updatePage, list pages (by project). Host implements.
- **WriterForgeDataAdapter** — getGraph (narrative), createGraph, updateGraph. Host implements. Used to load/save the narrative graph; commit writes back flow and page IDs.
- **WriterDataContext / ForgeDataContext** — Provide adapters. WriterWorkspace can receive dataAdapter and forgeDataAdapter as props or use context.

## Key entry points

- **Shell:** `packages/writer/src/components/WriterWorkspace/WriterWorkspace.tsx`
- **Layout:** WriterLayout, WriterProjectSwitcher, WriterTopBar under `layout/`
- **Sidebar:** WriterTree, WriterTreeRow under `sidebar/`
- **Editor:** WriterEditorPane and plugins under `editor/`
- **Store:** writer-workspace-store; slices: content, navigation, editor, ai, draft, viewState; subscriptions.ts
- **Modals:** WriterWorkspaceModals.tsx, WriterYarnModal.tsx

## Links

- [Writer workspace architecture](../architecture/writer-workspace-architecture.md) — Store slices, layout, editor, sync, AI patch, adapters.
- [Workspace editor architecture](../architecture/workspace-editor-architecture.md) — Canonical workspace pattern.
