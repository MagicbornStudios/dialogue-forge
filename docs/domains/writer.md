# Writer

## Overview
Writer is the narrative workspace for organizing story structure (acts, chapters, pages) and editing prose with AI assistance. It powers the `/writer` route alongside Forge in the host app.

## Tech Stack
Writer builds on the core text-editing and AI tooling in the repo:
- **Lexical** for rich-text editing and content blocks.
- **Zustand** for writer workspace state management.
- **CopilotKit** for AI-assisted authoring experiences.

## What Lives in the Writer Domain
- **Workspace shell**: `WriterWorkspace.tsx` is the entry point for the Writer UI and uses the Writer workspace store.
- **Narrative hierarchy**: Writer state includes acts, chapters, and pages. Sync with Forge narrative graph via WriterForgeDataAdapter.
- **Editor + navigation**: Editor pane, tree navigation, autosave, and toolbar; primary store importers.

## Writer State & AI Patch Workflow
- **Content state**: acts, chapters, pages, and active page live in WriterWorkspaceStore. Draft slice used for narrative graph + pending page creations.
- **AI patch system**: AI edits as patch operations (`WriterPatchOp`) for replace/splice/replace-block; editor can apply or preview.
- **AI preview + selection**: Store tracks AI proposals, selection ranges, and error status.

## How It Looks
- **Sidebar tree** for acts/chapters/pages navigation.
- **Editor pane** for the Lexical-based writing surface.

See [../architecture/writer-workspace-architecture.md](../architecture/writer-workspace-architecture.md) and [../how-to/writer-workspace-walkthrough.md](../how-to/writer-workspace-walkthrough.md).

## AI Integration
AI assistance is powered by CopilotKit. Writer integrates with CopilotKit's provider and actions; OpenRouter (or similar) for model routing.

## Host App Integration
Host-side adapters (WriterDataAdapter, WriterForgeDataAdapter) provide data access for pages and narrative graph (e.g. `app/lib/writer/` or equivalent).

## Related Docs
- [Writer workspace architecture](../architecture/writer-workspace-architecture.md)
- [Writer workspace walkthrough](../how-to/writer-workspace-walkthrough.md)
- [Workspace editor architecture](../architecture/workspace-editor-architecture.md)
- [Architecture graphs](../architecture/graphs/README.md)
