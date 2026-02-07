# Architecture

Overview of system and workspace architecture. Use these docs to reimplement or reason about the codebase.

## Index

- **workspace-editor-architecture.md** — Canonical workspace pattern: host vs workspace vs editor session vs editor library; store, session store, shell, commands; no draft slices, no event bus.
- **monorepo.md** — Monorepo layout (apps, packages).
- **boundaries-and-patterns.md** — Boundaries, file placement, and recurring patterns (merged from BOUNDARIES, PATTERNS, FILE-PLACEMENT, GLOSSARY).
- **forge-subscriptions.md** — Forge workspace subscriptions and project load.
- **character-workspace-architecture.md** — Character workspace design.
- **dialogue-domain-and-yarn.md** — Forge: narrative vs storylet graphs, node types, storylets/detours, Yarn export pipeline.
- **writer-workspace-architecture.md** — Writer: store slices, layout, editor, sync with narrative graph, AI patch workflow.

## Graphs and reports

- **graphs/** — Dependency graphs (dependency-cruiser, madge) and regeneration instructions. See [graphs/README.md](graphs/README.md).
