# Styling and theming

Unified structure so themes and domain context are consistent and easy to find.

## Where things live

| Purpose | File(s) | Notes |
|--------|--------|--------|
| **User themes** (data-theme) | `packages/shared/src/styles/themes.css` | `:root` + `html[data-theme='…']` (dark-fantasy, light, cyberpunk, darcula, high-contrast, girly). All `--color-df-*` and `--color-df-domain-*`. |
| **Domain context** (data-domain) | `packages/shared/src/styles/contexts.css` | Shared `--context-accent`, `--context-glow`, `--context-ring`; per-domain overrides (forge, writer, ai, video, character) and subcontext (e.g. node type). Video utility classes here too. |
| **Tailwind** | `styles/globals.css` | `@theme` maps CSS vars to Tailwind; `@source` for content. |
| **Forge nodes** | `packages/forge/src/styles/nodes.css` | Node tokens and `.dialogue-graph-editor` node/edge lookups. |
| **Graph edges** | `packages/shared/src/styles/graph.css` | Choice index → edge color; choice input border. |
| **Scrollbar + React Flow** | `packages/shared/src/styles/scrollbar.css` | Global scrollbar, React Flow controls (theme vars). |

App entry: `apps/host/styles/globals.css` imports themes, graph, nodes, contexts, scrollbar from `packages/shared/src/styles/`. Library entry: `packages/dialogue-forge/src/index.ts` imports the same set from `packages/shared/src/styles/`.

## Naming

- **Theme layer**  
  `--color-df-*`: semantic tokens (e.g. `--color-df-info`, `--color-df-warning`).  
  `--color-df-domain-{forge|writer|ai|video|character}`: domain accent for context theming; each user theme can override.

- **Context layer**  
  `--context-accent`, `--context-glow`, `--context-ring`: set per `[data-domain]` from `--color-df-domain-*` (or node-type vars in forge). No hardcoded colors in context files.

- **Domain-specific**  
  e.g. `--color-df-video`, `--video-canvas-bg`: derived in `contexts.css` from `--color-df-domain-video` / shared tokens so they follow the active theme.

## Adding a domain

1. In `packages/shared/src/styles/themes.css`: add `--color-df-domain-<name>` in `:root` and in each `html[data-theme='…']` block.
2. In `packages/shared/src/styles/contexts.css`: add `[data-domain="<name>"] { --context-accent: var(--color-df-domain-<name>); }` and any subcontext or utility classes.
3. In `apps/host/styles/globals.css` `@theme`: add `--color-df-domain-<name>` if you want Tailwind utilities.

## Adding a user theme

1. In `packages/shared/src/styles/themes.css`: add `html[data-theme='<name>'] { … }` with the same variable set as other themes (base, nodes, edges, status, text, controls, flags, canvas, sidebar, accent borders, domain accents).
2. Set `data-theme` on `html` (or your theme switcher) to `<name>`.



