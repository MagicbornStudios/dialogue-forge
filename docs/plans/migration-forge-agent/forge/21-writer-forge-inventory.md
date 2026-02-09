# Writer-forge inventory (Writer workspace)

Inventory of Writer workspace for migration to forge-agent (Writer editor or Notion-style Writer mode).

## Role

- Narrative prose: acts, chapters, pages; Lexical-based editor; AI patch workflow (WriterPatchOp).
- Sync with Forge narrative graph: narrative graph is loaded/saved via Forge hooks; act/chapter/page can map to graph nodes or (in forge-agent) to Notion-style PageDoc/BlockDoc.

## Store

- **packages/writer/src/components/WriterWorkspace/store/writer-workspace-store.tsx**
- **Slices:** content (acts, chapters, pages; active page), navigation (tree/selection), editor (Lexical state), ai (proposals, preview, selection, error), draft (narrative graph draft + pending page creations), viewState (modals), subscriptions (load pages and narrative graph on project change).
- **Commit:** buildOnCommitWriterDraft(api) — takes a small API object (createPage, updateGraph); createPage for pending page creations, then updateGraph. No adapters.
- **Helpers:** createNarrativeGraph(api, projectId) — same pattern with narrow API from hooks.

## Data flow (hooks, no adapters)

- **Writer data:** useWriterPages(projectId, narrativeGraphId), useWriterPage(pageId), useCreateWriterPage(), useUpdateWriterPage(), useDeleteWriterPage() in packages/writer/src/data/writer-queries.ts. Host provides QueryClientProvider and ForgePayloadProvider; no WriterDataAdapter.
- **Narrative graph:** useForgeGraphs(projectId, NARRATIVE), useForgeGraph(id), useCreateForgeGraph(), useUpdateForgeGraph() from @magicborn/forge. WriterWorkspace builds callbacks from these hooks and passes them into the store (getCallbacks).
- **setupWriterWorkspaceSubscriptions** — On selectedNarrativeGraphId change, fetchNarrativeGraph (from hook/callback) and set narrative graph; hierarchy recomputed when graph or pages change.

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

## Current implementation (where to look)

- **Hooks:** packages/writer/src/data/writer-queries.ts — useWriterPages, useWriterPage, useCreateWriterPage, useUpdateWriterPage, useDeleteWriterPage; comment hooks (useWriterComments, useCreateWriterComment, etc.). Narrative graph: useForgeGraphs, useForgeGraph, useCreateForgeGraph, useUpdateForgeGraph from @magicborn/forge.
- **Shell:** WriterWorkspace.tsx builds callbacks from these hooks (no useWriterDataContext or useForgeDataContext); passes getCallbacks() into createWriterWorkspaceStore; runs setupWriterWorkspaceSubscriptions(store, eventSink, fetchNarrativeGraph).
- **Store:** writer-workspace-store.tsx composes slices; buildOnCommitWriterDraft(api), createNarrativeGraph(api, projectId) take { createPage, updateGraph } (or equivalent) built from mutations.
- **Subscriptions:** store/slices/subscriptions.ts — fetchNarrativeGraph on selectedNarrativeGraphId; extractNarrativeHierarchySync on graph/pages change.
- **UI:** WriterLayout, WriterTree, WriterEditorPane; editor/lexical/plugins (AutosavePlugin, DraggableBlockPlugin, CommentPlugin, etc.). See [61-writer-current-implementation.md](../writer/61-writer-current-implementation.md) for full map.

## Migration notes

- Forge-agent has Notion-inspired PageDoc, BlockDoc, PageParent, BlockParent (packages/types/src/page.ts). Plan 32 defines mapping: narrative graph nodes vs Notion pages for Writer mode.
