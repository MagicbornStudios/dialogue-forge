# Repository Structure (Target Monorepo)

This document defines the standard layout for the Dialogue Forge monorepo. It is modeled after a packages + apps layout so domains can ship as separate packages while the host app consumes them directly.

## Target Layout

```
.
+-- apps/
?   +-- host/                 # Next.js host app (Payload + demo UI)
+-- packages/
?   +-- shared/               # Cross-domain types, utils, UI primitives
?   +-- forge/                # Forge domain (graph editor)
?   +-- writer/               # Writer domain (narrative editor)
?   +-- video/                # Video domain (template editor)
?   +-- ai/                   # AI infrastructure and adapters
?   +-- characters/           # Character workspace domain
?   +-- dialogue-forge/       # Umbrella package that re-exports domains
+-- docs/
+-- scripts/
+-- vendor/
+-- package.json              # Workspace root (private)
+-- tsconfig.base.json        # Shared TS config
+-- turbo.json                # Optional task orchestration
```

## Responsibilities

- apps/host
  - Owns Next.js routing, PayloadCMS wiring, API routes, and host-only UI.
  - Implements adapter contracts for external systems.
  - May import from packages/* only.

- packages/shared
  - The lowest common layer. Pure types, utilities, shared UI.
  - Must not import from any other package in this repo.

- packages/runtime
  - Dialogue execution, flag evaluation, and playback utilities.
  - Depends on packages/shared only.

- packages/forge, packages/writer, packages/video, packages/characters
  - Domain-specific UI, types, stores, and utilities.
  - May import from packages/shared and packages/runtime.
  - Must not import from each other.

- packages/ai
  - AI infrastructure and domain adapters.
  - May import from packages/shared.
  - Must not import from domain packages or apps.

- packages/dialogue-forge
  - Public umbrella package that re-exports APIs from domain packages.
  - Intended for compatibility with existing imports.

## Placement Rules (Short Version)

1. Host app wiring or Payload-specific code goes in apps/host.
2. Cross-domain types and utilities go in packages/shared.
3. Domain-specific logic goes in that domain package.
4. AI providers and adapters go in packages/ai.

## Package Naming

- Domain packages use @magicborn/<domain>.
- Umbrella package keeps @magicborn/dialogue-forge.
- All packages publish from dist/ with typed exports.

## Adapter Contracts

Adapters are interfaces defined in packages/* and implemented in apps/host. See docs/conventions/adapters.md.

## Status

- Host app lives in `apps/host`.
- Library source lives in `packages/dialogue-forge`.
- Domain packages (shared/runtime/forge/etc.) are not yet extracted.

