# Writer current implementation

Map of **how the Writer is implemented now** in dialogue-forge so implementers know where to look and what to port. For features and requirements see [60-writer-features-and-requirements.md](60-writer-features-and-requirements.md).

## Page and block persistence (current)

- Current page persistence is a single page-level blob (`bookBody`) containing serialized Lexical JSON.
- There is no first-class BlockDoc-style backend model for Writer content blocks.
- Autosave serializes full editor state and writes it through page update paths (`updatePage(..., { bookBody })` pattern), so saves overwrite full document content.
- `DraggableBlockPlugin` reorders Lexical nodes in-memory, but reorder persistence is only captured indirectly by the next whole-document autosave.
- No block-level versioning contract exists today; versioning is page-level.
- Target-state design for Notion-shaped pages/blocks and persisted block reorder is in [63-writer-pages-blocks-and-reorder.md](63-writer-pages-blocks-and-reorder.md).

## Workspace shell and store

- **[WriterWorkspace.tsx](../../../packages/writer/src/components/WriterWorkspace/WriterWorkspace.tsx)** — Shell; builds callbacks from hooks (no adapters); subscriptions; layout/tree/editor/modals. Passes getCallbacks() into createWriterWorkspaceStore; fetchNarrativeGraph from Forge hooks.
- **[writer-workspace-store.tsx](../../../packages/writer/src/components/WriterWorkspace/store/writer-workspace-store.tsx)** — Slice composition; buildOnCommitWriterDraft(api), createNarrativeGraph(api, projectId); getCallbacks() supplies createPage, updatePage, getNarrativeGraph, createNarrativeGraph, onCommitWriterDraft.
- **[writer-workspace-types.ts](../../../packages/writer/src/components/WriterWorkspace/store/writer-workspace-types.ts)** — WriterWorkspaceState, save status, AI proposal status, getPlainTextFromSerializedContent.

## Store slices (brief map)

| Slice | Role |
|-------|------|
| content | pages, pageMap, setPages, updatePage, setContentError |
| navigation | activePageId, expandedPageIds, setActivePageId, togglePageExpanded, setNavigationError |
| editor | save, editor error (setEditorError) |
| ai | proposal status, preview, selection, error (WriterPatchOp flow) |
| draft | narrative graph draft, pending page creations, commit/discard/reset |
| viewState | modals, panels, page layout, autosave enabled |

- **[subscriptions.ts](../../../packages/writer/src/components/WriterWorkspace/store/slices/subscriptions.ts)** — fetchNarrativeGraph on selectedNarrativeGraphId change; narrative hierarchy recompute on graph or pages change (extractNarrativeHierarchySync).

## Data and hooks

- **[writer-queries.ts](../../../packages/writer/src/data/writer-queries.ts)** — useWriterPages(projectId, narrativeGraphId), useWriterPage(pageId), useCreateWriterPage(), useUpdateWriterPage(), useDeleteWriterPage(); comment hooks (useWriterComments, useCreateWriterComment, useUpdateWriterComment, useDeleteWriterComment). Uses ForgePayloadClient from @magicborn/forge.
- **Narrative graph:** useForgeGraphs(projectId, NARRATIVE), useForgeGraph(id), useCreateForgeGraph(), useUpdateForgeGraph() from @magicborn/forge. WriterWorkspace builds getNarrativeGraph and createNarrativeGraph from these.

## UI components

- **Layout:** [WriterLayout.tsx](../../../packages/writer/src/components/WriterWorkspace/layout/WriterLayout.tsx), [WriterProjectSwitcher.tsx](../../../packages/writer/src/components/WriterWorkspace/layout/WriterProjectSwitcher.tsx), [WriterTopBar.tsx](../../../packages/writer/src/components/WriterWorkspace/layout/WriterTopBar.tsx).
- **Sidebar:** [WriterTree.tsx](../../../packages/writer/src/components/WriterWorkspace/sidebar/WriterTree.tsx), [WriterTreeRow.tsx](../../../packages/writer/src/components/WriterWorkspace/sidebar/WriterTreeRow.tsx) — hierarchy, create/rename/delete page, selection.
- **Editor:** [WriterEditorPane.tsx](../../../packages/writer/src/components/WriterWorkspace/editor/WriterEditorPane.tsx); Lexical plugins under [editor/lexical/plugins/](../../../packages/writer/src/components/WriterWorkspace/editor/lexical/plugins/) — AutosavePlugin, DraggableBlockPlugin, CommentPlugin, ToolbarPlugin, and others.
- **Modals:** WriterWorkspaceModalsRenderer, [WriterYarnModal.tsx](../../../packages/writer/src/components/WriterWorkspace/modals/components/WriterYarnModal.tsx).

## Sync and helpers

- **[narrative-graph-sync.ts](../../../packages/writer/src/lib/sync/narrative-graph-sync.ts)** — extractNarrativeHierarchySync(graph, pages); used by subscriptions to derive narrative hierarchy.
- **[use-graph-page-sync.ts](../../../packages/writer/src/hooks/use-graph-page-sync.ts)** — Graph/page sync behavior (if still used by a caller).

## Types

- **[writer-ai-types.ts](../../../packages/writer/src/types/writer-ai-types.ts)** — WriterPatchOp (setTitle, replaceSelectedText, insertParagraphAfterBlock, replaceBlockText, deleteBlock), WriterSelectionSnapshot, WriterDocSnapshot.
- **ForgePage, PAGE_TYPE, NarrativeHierarchy** from shared/narrative ([@magicborn/shared/types/narrative](../../../packages/shared/src/types/narrative.ts) or equivalent).

## References

- [21-writer-forge-inventory.md](21-writer-forge-inventory.md) — Inventory and data flow summary.
- [60-writer-features-and-requirements.md](60-writer-features-and-requirements.md) — Features we need.
- [docs/architecture/writer-workspace-architecture.md](../../architecture/writer-workspace-architecture.md) — Architecture and invariants.
