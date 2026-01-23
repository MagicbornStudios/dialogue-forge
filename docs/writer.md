# Writer

## Overview
Writer is the narrative workspace for organizing story structure (acts, chapters, pages) and editing prose with AI assistance. It powers the `/writer` route alongside Forge in the host app.

## Tech Stack
Writer builds on the core text-editing and AI tooling in the repo:
- **Lexical** for rich-text editing and content blocks.
- **Zustand** for writer workspace state management.
- **CopilotKit** for AI-assisted authoring experiences.

## What Lives in the Writer Domain
- **Workspace shell**: `WriterWorkspace.tsx` is the entry point for the Writer UI and uses the Writer workspace store for state management.
- **Narrative hierarchy**: Writer state includes `acts`, `chapters`, `pages`, and per-page drafts for editing workflow continuity.
- **Editor + navigation**: The writer editor pane, tree navigation, autosave, and toolbar are called out as primary store importers, anchoring the main editing surface and tooling.

## Writer State & AI Patch Workflow
Writer’s state model is documented in the store inventory:
- **Content state**: acts, chapters, pages, active page, and drafts live together in `WriterWorkspaceStore` today.
- **AI patch system**: AI edits are represented as patch operations (`WriterPatchOp`) for replace/splice/replace-block behaviors, which the editor can apply or preview.
- **AI preview + selection**: The store tracks AI proposals, selection ranges, and error status for Copilot-assisted authoring.

## How It Looks
Writer uses a dedicated layout component that splits the UI into:
- **Sidebar tree** for acts/chapters/pages navigation.
- **Editor pane** for the Lexical-based writing surface.

See the Writer layout snippet in the parity report for the canonical structure.

## AI Integration
AI assistance is powered by CopilotKit. The Writer workspace integrates with CopilotKit’s provider and actions, and requires OpenRouter configuration as described in the CopilotKit setup docs.

## Architecture Graphs
The latest generated dependency graphs and reports live in:
- `docs/architecture/graphs/dependency-cruiser.mmd` (Mermaid)
- `docs/architecture/graphs/dependency-cruiser.d2` (D2)
- `docs/architecture/graphs/madge.json` (Madge dependency map)
- `docs/architecture/dependency-cruiser.json` (raw cruise output)
- `docs/architecture/latest-analysis.md` (summary report)

## Host App Integration
Host-side adapters live in `app/lib/writer/`, as shown in the repo structure overview. These adapters provide data access for acts, chapters, and pages.

## Related Docs
- [CopilotKit Setup](./copilotkit-setup.md)
- [Environment Variables](./environment-variables.md)
- [Workspace Editor Architecture](./architecture/workspace-editor-architecture.md)
- [Writer ↔ Forge Parity Plan](./reorg-discovery/06-writer-vs-forge-parity.md)
- [Architecture Graphs](./architecture/graphs/README.md)
