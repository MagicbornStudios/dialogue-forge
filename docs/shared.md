# Shared

## Overview
Shared code is the lowest common layer for Forge and Writer. It houses cross-domain UI primitives, utility helpers, and shared types that must not depend on domain-specific code.

## Tech Stack
Shared UI and utilities use:
- **Radix UI** primitives for accessible components.
- **class-variance-authority + clsx + tailwind-merge** for styling and class composition.
- **Tailwind CSS** conventions for shared UI styling.

## What Lives in `packages/shared/src/`
- **UI primitives**: Buttons, badges, cards, menus, and other composable UI building blocks live in `packages/shared/src/ui/` (example: `Button` uses shared Tailwind + Radix patterns).
- **Shared utilities**: `packages/shared/src/lib/utils.ts` provides helpers like `cn` for class name composition, used across Forge, Writer, and video tooling.
- **Shared types**: DOM event and keyboard constants live in `packages/shared/src/types/index.ts` for consistent input handling across domains.

## How It Looks
Shared components define the visual building blocks (buttons, cards, menus, tooltips) used across Forge, Writer, and Video workspaces.

## Integration Rules
Shared code may be imported by Forge, Writer, and AI layers, but it cannot import from domain or host layers. This is enforced by the architecture boundary rules.

## Where to Add Shared Code
- **Reusable UI components** used by multiple domains → `packages/shared/src/ui/`
- **Utilities** (formatting, helpers, small shared logic) → `packages/shared/src/lib/`
- **Input constants or common data contracts** → `packages/shared/src/types/`

## Architecture Graphs
The latest generated dependency graphs and reports live in:
- `docs/architecture/graphs/dependency-cruiser.mmd` (Mermaid)
- `docs/architecture/graphs/dependency-cruiser.d2` (D2)
- `docs/architecture/graphs/madge.json` (Madge dependency map)
- `docs/architecture/dependency-cruiser.json` (raw cruise output)
- `docs/architecture/latest-analysis.md` (summary report)

## Related Docs
- [Architecture Boundaries](./architecture/BOUNDARIES.md)
- [File Placement Guide](./architecture/FILE-PLACEMENT.md)
- [Architecture Graphs](./architecture/graphs/README.md)

