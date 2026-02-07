# Styling and theming

Unified structure so themes and domain context are consistent. Merged from conventions/styling.md and agents/styling.md. For reimplementation: where styles live and how to add themes/domains.

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

## Agent loop (before/after styling changes)

**Before you edit**
- See "Where things live" above. User themes = `packages/shared/src/styles/themes.css`. Domain context = `packages/shared/src/styles/contexts.css`. Prefer Tailwind + theme vars; add new CSS only when necessary.
- Domain packages must not import from the host app. Use `--color-df-*` or `--context-*`.
- If the file is under `_legacy-*` or stale, check docs/plans/styling-cleanup-audit.md and consider removing or refactoring.

**Rules (non-negotiable)**
- Tailwind first. Use Tailwind utilities and `@theme` tokens (e.g. `bg-df-surface`, `text-df-text-primary`, `border-df-control-border`).
- No hardcoded colors in app UI. Use CSS variables or Tailwind classes that map to theme vars.
- Inline `style={{}}` only for layout (position, dimensions from data) or passing through a var. Not for fixed hex/rgb.
- New CSS files: avoid. Add to contexts.css for domain context or existing domain/feature CSS.
- Workspaces that should be themed by domain must wrap content in a node with `data-domain="forge"` | `"writer"` | etc.

**After you edit**
- No new hex/oklch/rgb/hsl literals for UI chrome.
- New or changed styles use Tailwind or existing theme/context vars.
- If you added a new CSS file, document it here or in the audit.

## Quick reference

| Need | Use |
|------|-----|
| Background | `bg-df-surface`, `bg-df-canvas-bg`, `bg-df-control-bg` |
| Border | `border-df-control-border`, `border-df-border-hover` |
| Text | `text-df-text-primary`, `text-df-text-secondary`, `text-df-text-tertiary` |
| Accent (domain) | `--context-accent` (set by `data-domain`) or `text-df-domain-forge` etc. |
| Status | `text-df-error`, `text-df-warning`, `text-df-success`, `text-df-info` |

When in doubt, open `packages/shared/src/styles/themes.css` and use an existing `--color-df-*` name; then use it via Tailwind (if in `@theme`) or `var(--color-df-*)` in rare custom CSS.
