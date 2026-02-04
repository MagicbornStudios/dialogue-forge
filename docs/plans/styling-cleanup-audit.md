# Styling and codebase cleanup audit

Use this list when refactoring for consistency and before the monorepo migration. **Review usage first; remove only when unused or replaced.**

**Completed Feb 2026:** Phase 1 (single-source CSS), Phase 2 (Forge UI theme tokens), Phase 3 (legacy video workspace removed), Phase 4 (Characters RelationshipGraphEditorBlank). Duplicate themes/graph/scrollbar removed; app imports from `packages/shared/src/styles/`.

## 1. Non-Tailwind / non-theme styling to fix

These use hardcoded hex/colors or bypass our theme. Prefer Tailwind + `--color-df-*` or `--context-*`.

### Forge

| File | Issue | Action |
|------|--------|--------|
| `NodePalette.tsx` | Hardcoded hex map for node type colors | Prefer mapping to `--node-*-accent` or theme tokens (optional) |
| `forge-flow-helpers.ts` / `forge-edge-styles.ts` | Hex palette for edge/node types | Consider mapping to existing `--node-*-accent` / theme vars (optional) |

*ForgeNarrativeGraphEditor, ForgeStoryletGraphEditor, GuidePanel, PlayView, GamePlayer, FlagSelector, PlayerNodeFields, ConditionalNodeFields, NodeEditorRuntimeDirectivesField, NodeEditorIdField, NextNodeSelector, ConditionAutocomplete, YarnView, CodeBlock — done (theme tokens).*

### Video

| File | Issue | Action |
|------|--------|--------|
| `parameterized-templates.tsx` | Defaults `#3b82f6`, `#000000`, `#ffffff`, `#1a1a2a` | Use theme vars or `--color-df-domain-video` for defaults where appropriate |
| `player/*` (Text, Rectangle, Circle, Background, VideoCompositionRenderer) | Fallback hex for layer styles | Keep as fallbacks for user content; ensure UI chrome uses theme |
| `default-templates.ts` | Hex in template defaults | Optional: derive from theme or keep as content defaults |

*`_legacy-workspace/` — removed Feb 2026.*

### Writer (Lexical)

| File | Issue | Action |
|------|--------|--------|
| Lexical UI (ColorPicker, ToolbarPlugin, etc.) | Swatches and defaults (hex) | Content/editor defaults; acceptable. Ensure surrounding chrome uses theme. |
| StickyComponent | `#fdfd86`, `#ffff88`, etc. for sticky colors | Consider theme-aligned palette or leave as content styling |
| TableCellResizer | `#76b6ff`, `#adf` | Consider `var(--color-df-info)` or similar |
| VersionsPlugin | Hex for version colors | Could map to theme if desired |

### Characters

| File | Issue | Action |
|------|--------|--------|
| `characterElement.ts` | `flood-color` hex | Likely graph viz; check if theme var can apply |

*RelationshipGraphEditorBlank — done (bg-df-surface, border-df-control-border).*

## 2. Stale / legacy files to review first

- **`packages/writer/src/.../lexical/ui/*.css`** — Many small CSS files (Button, Input, Modal, etc.). Third-party editor surface; consolidate or leave as-is per convention. Prefer not adding new ones.

*Duplicate theme/graph/scrollbar — done (single source `packages/shared/src/styles/`). Legacy video workspace — removed.*

## 3. CSS files inventory

| Location | Role | Action |
|----------|------|--------|
| `apps/host/styles/globals.css` | App entry; imports from `packages/shared/src/styles/` | Keep. |
| `packages/shared/src/styles/themes.css`, `graph.css`, `scrollbar.css`, `contexts.css` | Single source for theme, graph, scrollbar, domain context | Keep. |
| `packages/forge/src/styles/nodes.css` | Forge node tokens | Keep. |
| `packages/writer/src/.../lexical/**/*.css` | Lexical editor | Keep; avoid adding. Prefer Tailwind for new UI around editor. |

## 4. Monorepo alignment

Per [docs/architecture/monorepo.md](../architecture/monorepo.md) and [docs/plans/monorepo-migration.md](monorepo-migration.md):

- **Shared styling:** Theme and context tokens should live in a shared package or a single app-owned entry so packages don’t duplicate `themes.css` / `contexts.css`.
- **Domain packages** must not import from the host app; they may depend on `shared` (and runtime). Theme vars are consumed via CSS (global) or a small shared tokens contract.
- When extracting packages, move domain-specific CSS (e.g. `nodes.css`, video context) with the package and document in that package’s README.

---

**Loop:** When touching any file in this audit, run [docs/agents/styling.md](../agents/styling.md) and update this list if you fix or remove an item.

