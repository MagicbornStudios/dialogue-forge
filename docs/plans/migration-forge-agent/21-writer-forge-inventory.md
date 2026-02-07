# Writer-forge inventory (Writer workspace)

Inventory of Writer workspace for migration to forge-agent (Writer editor or Notion-style Writer mode).

## Role

- Narrative prose: acts, chapters, pages; Lexical-based editor; AI patch workflow (WriterPatchOp).
- Sync with Forge narrative graph: WriterForgeDataAdapter loads/saves the narrative graph; act/chapter/page can map to graph nodes or (in forge-agent) to Notion-style PageDoc/BlockDoc.

## Store

- **packages/writer/src/components/WriterWorkspace/store/writer-workspace-store.tsx**
- **Slices:** content (acts, chapters, pages; active page), navigation (tree/selection), editor (Lexical state), ai (proposals, preview, selection, error), draft (narrative graph draft + pending page creations), viewState (modals), subscriptions (load pages and narrative graph on project change).
- **Commit:** buildOnCommitWriterDraft(dataAdapter, forgeDataAdapter) — createPage for pending page creations, then forgeDataAdapter.updateGraph.
- **Helpers:** createNarrativeGraphWithAdapter(adapter, projectId).

## Data flow and adapters

- **WriterDataAdapter** — createPage, updatePage, list pages (by project).
- **WriterForgeDataAdapter** — getGraph (narrative), createGraph, updateGraph.
- WriterDataContext, ForgeDataContext (from forge) provide adapters; host can pass dataAdapter and forgeDataAdapter props.
- **setupWriterWorkspaceSubscriptions** — On project change, load pages and narrative graph; set initial active page.

## Layout

- WriterLayout — Wraps sidebar + editor pane + top bar.
- WriterTree, WriterTreeRow — Sidebar tree (acts/chapters/pages); expand/collapse, selection, open page.
- WriterEditorPane — Lexical editor (packages/writer/src/components/WriterWorkspace/editor/).
- WriterTopBar, WriterProjectSwitcher (in layout).
- WriterWorkspaceModalsRenderer — e.g. WriterYarnModal.

## Editor

- Lexical: WriterEditorPane and plugins under editor/ (e.g. DraggableBlockPlugin).
- Sync with store; autosave debounced.
- AI patch: WriterPatchOp (replace, splice, replace-block); store tracks proposal status and preview; editor can apply or preview. CopilotKit integration.

## Key files

- WriterWorkspace.tsx — Shell; store creation with callbacks (updatePage, createPage, getNarrativeGraph, createNarrativeGraph, onCommitWriterDraft); subscriptions; layout/tree/editor/modals.
- store/slices: content.slice, navigation.slice, editor.slice, ai.slice, draft.slice, viewState.slice, subscriptions.ts.
- layout/WriterLayout.tsx, WriterProjectSwitcher.tsx, WriterTopBar.tsx.
- sidebar/WriterTree.tsx, WriterTreeRow.tsx.
- editor/WriterEditorPane and plugins.
- modals/WriterWorkspaceModals.tsx, WriterYarnModal.tsx.

## Types

- Writer workspace types in store (writer-workspace-types.ts); WriterPatchOp, WriterAiProposalStatus, etc. in writer-ai-types.
- Narrative hierarchy and page types from shared (e.g. ForgePage, PAGE_TYPE).

## Migration notes

- Forge-agent has Notion-inspired PageDoc, BlockDoc, PageParent, BlockParent (packages/types/src/page.ts). Plan 32 defines mapping: narrative graph nodes vs Notion pages for Writer mode.
