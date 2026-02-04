# Coding Conventions

These conventions apply to all packages and the host app. They are additive to the rules in docs/architecture/BOUNDARIES.md and docs/architecture/PATTERNS.md.

## Type Safety (Non-Negotiable)

- Never use string literals for type discriminators.
- Always use exported constants from packages/shared.
- Example:
  - Use NODE_TYPE.NPC, not "npc".

## Imports and Boundaries

- apps/host may import from packages/*.
- packages/shared must not import from any other package in this repo.
- Domain packages (forge, writer, video, characters) may import from shared + runtime. They may also import from packages/ai for CopilotKit provider wiring.
- AI package may import from shared only.
- Cross-domain imports between forge, writer, video, characters are forbidden.
- Exception: Forge may import Video types/renderers for playback (document new usage).
- No package may import from apps/host.
- No `@/` alias in code; use `@magicborn/<domain>/*` (e.g. `@magicborn/forge/*`) or relative paths.

## File and Component Naming

- React components: PascalCase file names (ExampleComponent.tsx).
- Non-component files: kebab-case (graph-layout.ts, flag-manager.ts).
- One component per file unless the helpers are tightly coupled and private.
- V2 components use the V2 suffix (NPCNodeV2.tsx).

## Folder Organization (Inside a Package)

- src/index.ts is the public API surface (inside each package).
- src/types for domain types.
- src/components for UI.
- src/utils for pure helpers.
- src/adapters for adapter contracts (interfaces only).

## Data Flow

- Keep state updates immutable.
- Prefer explicit props over hidden imports or global state.
- Limit useEffect usage to the minimal required footprint.
- No draft slices and no event bus in new work; use direct actions and debounced saves instead.

## Testing

- Unit tests live next to their source with .test.ts/.test.tsx.
- Shared utilities and store slices must have unit tests.
- Avoid snapshot tests for logic-heavy modules.

## Styling and context theming

- Prefer the **Tailwind v4** ecosystem and our theme/context system. See [docs/conventions/styling.md](styling.md) for where things live and naming.
- **No hardcoded colors** in app UI (no `#hex`, `rgb()`, or raw `oklch()` in JSX/TSX for chrome). Use Tailwind classes that map to `--color-df-*` or `var(--color-df-*)` / `var(--context-accent)` in rare custom CSS.
- **Domain context:** Wrap workspace roots with `data-domain="forge"` | `"writer"` | `"ai"` | `"video"` | `"character"` so [packages/shared/src/styles/contexts.css](../../packages/shared/src/styles/contexts.css) applies. Domain accents come from `--color-df-domain-*` in [packages/shared/src/styles/themes.css](../../packages/shared/src/styles/themes.css).
- **Inline `style={{}}`** only for layout (position, dimensions from data) or passing a theme var. New visual styling belongs in Tailwind or the theme/context CSS.
- **Agents:** Before/after any styling change, follow [docs/agents/styling.md](../agents/styling.md) (the styling loop).

## Documentation

- Update docs/architecture or docs/conventions when adding new patterns.
- Keep docs additive; do not delete history.
- Use clear headings and short lists.
