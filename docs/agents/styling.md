# Agent guide: Styling and consistency

**When to read:** Before adding or changing any UI styling, theming, or CSS. After edits, run the checklist below.

This doc is the **styling loop**: follow it every time you touch styles so the codebase stays consistent and theme-friendly.

## 1. Before you edit

- [ ] **Where does it live?** See [docs/conventions/styling.md](../conventions/styling.md). User themes = `packages/shared/src/styles/themes.css`. Domain context = `packages/shared/src/styles/contexts.css`. Prefer Tailwind + theme vars; add new CSS only when necessary.
- [ ] **Is this domain or app?** Domain packages (forge, writer, video, characters) must not import from the host app. Use `--color-df-*` or `--context-*` from our theme/context system.
- [ ] **Stale first.** If the file is under `_legacy-*` or hasn’t been updated in a long time, check [docs/plans/styling-cleanup-audit.md](../plans/styling-cleanup-audit.md) and consider removing or refactoring instead of adding more styling.

## 2. Rules (non-negotiable)

- **Tailwind first.** Use Tailwind utilities and our `@theme` tokens (e.g. `bg-df-surface`, `text-df-text-primary`, `border-df-control-border`). See `apps/host/styles/globals.css` `@theme` for available names.
- **No hardcoded colors in app UI.** No `#0d0d14`, `#2a2a3e`, `#ffffff`, `#e94560`, etc. in JSX/TSX for backgrounds, borders, or text. Use CSS variables (`var(--color-df-*)`) or Tailwind classes that map to theme vars.
- **Inline `style={{}}` only for:** layout (position, left/top, width/height from data), or passing through a var (e.g. `style={{ color: 'var(--color-df-info)' }}`). Not for fixed hex/rgb.
- **New CSS files:** Avoid. Add to `packages/shared/src/styles/contexts.css` for domain context, or to existing domain/feature CSS. Lexical/third-party editor CSS is an exception.
- **Domain context:** Workspaces that should be themed by domain must wrap content in a node with `data-domain="forge"` | `"writer"` | `"ai"` | `"video"` | `"character"` so `packages/shared/src/styles/contexts.css` applies.

## 3. After you edit — checklist

- [ ] No new hex/oklch/rgb/hsl literals in component code for UI chrome (borders, backgrounds, text).
- [ ] New or changed styles use Tailwind or existing theme/context vars.
- [ ] If you added a new CSS file, you had a good reason and it’s documented in styling.md or the audit.
- [ ] [docs/conventions/coding-conventions.md](../conventions/coding-conventions.md) and [docs/conventions/styling.md](../conventions/styling.md) still reflect the code (update them if you introduced a new pattern).

## 4. Quick reference

| Need | Use |
|------|-----|
| Background | `bg-df-surface`, `bg-df-canvas-bg`, `bg-df-control-bg` |
| Border | `border-df-control-border`, `border-df-border-hover` |
| Text | `text-df-text-primary`, `text-df-text-secondary`, `text-df-text-tertiary` |
| Accent (domain) | `--context-accent` (set by `data-domain`) or `text-df-domain-forge` etc. |
| Status | `text-df-error`, `text-df-warning`, `text-df-success`, `text-df-info` |

When in doubt, open `packages/shared/src/styles/themes.css` and use an existing `--color-df-*` name; then use it via Tailwind (if in `@theme`) or `var(--color-df-*)` in rare custom CSS.


