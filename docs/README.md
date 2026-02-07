# Dialogue Forge Documentation

This repo is deprecated. Documentation is kept for **knowledge capture and reimplementation**: what was working and how it was structured.

## Where to look

- **[architecture/](architecture/README.md)** — Workspace and system design: workspace-editor pattern, monorepo, Forge (dialogue/Yarn), Writer workspace, boundaries and patterns.
- **[domains/](domains/README.md)** — Domain overviews: Forge, Writer, Video, Shared, Runtime.
- **[design/](design/README.md)** — Styling, theming, and component usage.
- **[how-to/](how-to/README.md)** — Walkthroughs: Forge workspace, Writer workspace, building a workspace, data/state, adding AI.
- **[conventions/](conventions/README.md)** — Coding conventions, repo structure, adapters.
- **[agent-artifacts/](agent-artifacts/README.md)** — Status, decisions, errors/attempts, tool usage; archive of superseded artifacts.
- **[plans/](plans/)** — Migration and audit plans.

## Quick links

- [Workspace editor architecture](architecture/workspace-editor-architecture.md) — Canonical workspace pattern (store, session, shell, no draft slices, no event bus).
- [Dialogue domain and Yarn](architecture/dialogue-domain-and-yarn.md) — Forge: narrative vs storylet graphs, nodes, storylets/detours, Yarn export.
- [Writer workspace architecture](architecture/writer-workspace-architecture.md) — Writer: store, layout, editor, sync with narrative graph, AI patch.
- [Forge workspace walkthrough](how-to/forge-workspace-walkthrough.md)
- [Writer workspace walkthrough](how-to/writer-workspace-walkthrough.md)
