# Writer Workspace Walkthrough

Step-by-step view of Writer behavior and data flow.

## What Writer Is

Writer is the prose workspace for acts, chapters, and pages. It uses Lexical for editing and keeps narrative structure aligned with Forge narrative graphs.

## Layout

- Top bar: optional project switcher or host controls.
- Sidebar tree: acts, chapters, pages (`WriterTree`).
- Editor pane: Lexical surface for active page (`WriterEditorPane`).
- Modals: writer-specific modal surfaces from `WriterWorkspaceModalsRenderer`.

## Typical Flow

1. Open Writer.
2. Project id is set in `WriterWorkspace`.
3. Writer loads narrative graphs through Forge hooks.
4. Writer loads pages through `useWriterPages(projectId, selectedNarrativeGraphId)`.
5. Store actions hydrate tree and active page.
6. Editing calls `useUpdateWriterPage` mutation.
7. Creating structure uses `useCreateWriterPage` and draft-commit helpers.
8. Draft commit creates pages first, then updates narrative graph.

## Data Hooks

Writer hooks:
- `useWriterPages`
- `useWriterPage`
- `useCreateWriterPage`
- `useUpdateWriterPage`
- `useDeleteWriterPage`
- `useWriterComments`
- `useCreateWriterComment`
- `useUpdateWriterComment`
- `useDeleteWriterComment`

Forge hooks/helpers used by Writer:
- `useForgeGraphs`
- `useForgeProject`
- `useCreateForgeGraph`
- `useUpdateForgeGraph`
- `fetchForgeGraph`

## Provider Requirements

Host must wrap Writer with:

- `QueryClientProvider`
- `ForgePayloadProvider`

Writer no longer accepts or reads `WriterDataAdapter` or `WriterForgeDataAdapter`.

## Key Files

- `packages/writer/src/components/WriterWorkspace/WriterWorkspace.tsx`
- `packages/writer/src/components/WriterWorkspace/sidebar/WriterTree.tsx`
- `packages/writer/src/components/WriterWorkspace/editor/WriterEditorPane.tsx`
- `packages/writer/src/components/WriterWorkspace/store/writer-workspace-store.tsx`
- `packages/writer/src/data/writer-queries.ts`

