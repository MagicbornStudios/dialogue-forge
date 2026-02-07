# Shared

## Overview
Shared code is the lowest common layer for Forge and Writer. It houses cross-domain UI primitives, utility helpers, and shared types that must not depend on domain-specific code.

## Tech Stack
Shared UI and utilities use:
- **Radix UI** primitives for accessible components.
- **class-variance-authority + clsx + tailwind-merge** for styling and class composition.
- **Tailwind CSS** conventions for shared UI styling.

## What Lives in `packages/shared/src/`
- **UI primitives**: Buttons, badges, cards, menus, and other composable UI building blocks in `packages/shared/src/ui/`.
- **Shared utilities**: `packages/shared/src/lib/utils.ts` provides helpers like `cn` for class name composition.
- **Shared types**: DOM event and keyboard constants in `packages/shared/src/types/` for consistent input handling.

## Integration Rules
Shared code may be imported by Forge, Writer, and AI layers; it cannot import from domain or host layers. See [../architecture/boundaries-and-patterns.md](../architecture/boundaries-and-patterns.md).

## Where to Add Shared Code
- **Reusable UI components** used by multiple domains → `packages/shared/src/ui/`
- **Utilities** (formatting, helpers) → `packages/shared/src/lib/`
- **Input constants or common data contracts** → `packages/shared/src/types/`

## Related Docs
- [Boundaries and patterns](../architecture/boundaries-and-patterns.md)
- [Architecture graphs](../architecture/graphs/README.md)
