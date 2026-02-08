# Writer

## Overview

Writer is the narrative workspace for organizing structure (`ACT`, `CHAPTER`, `PAGE`) and editing prose with Lexical.

## Tech Stack

- Lexical for editor behavior
- Zustand for workspace state
- React Query hooks for data reads and mutations
- CopilotKit-based AI patch flows

## What Lives in Writer

- Workspace shell: `WriterWorkspace.tsx`
- Sidebar tree and hierarchy operations
- Editor pane and save flows
- Commenting flows and writer modals
- Writer store slices and draft commit helpers

## Data Access

Writer data access is hook-based.

- Writer hooks live in `packages/writer/src/data/writer-queries.ts`.
- Narrative graph reads and mutations are consumed from `@magicborn/forge`.
- No Writer adapter contexts are used.

## Host Integration

Host app provides:

- `QueryClientProvider`
- `ForgePayloadProvider`

Host should not build `WriterDataAdapter` or `WriterForgeDataAdapter` objects.

## Related Docs

- `docs/architecture/writer-workspace-architecture.md`
- `docs/how-to/writer-workspace-walkthrough.md`
- `docs/conventions/adapters.md`
- `docs/architecture/workspace-editor-architecture.md`

