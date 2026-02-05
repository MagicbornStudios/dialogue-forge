# Monorepo Architecture (Target)

This document defines the target monorepo architecture and package boundaries. It is the reference for the migration plan in docs/plans/monorepo-migration.md.

## Goals

- Domain packages can build and publish independently.
- Host app consumes packages directly from the workspace.
- Boundaries are enforced via tooling and TypeScript project references.
- Adapters are contracts defined in packages and implemented by the host.

## Package Dependency Rules

- shared: no internal dependencies.
- ai: shared only.
- forge/writer/video/characters: shared (and ai for CopilotKit wiring).
- dialogue-forge: re-exports from other packages.
- host app: may import from any package.

## Target Package Graph

```
apps/host
  -> packages/dialogue-forge
  -> packages/forge
  -> packages/writer
  -> packages/video
  -> packages/characters
  -> packages/shared
  -> packages/ai

packages/dialogue-forge
  -> packages/forge
  -> packages/writer
  -> packages/video
  -> packages/characters
  -> packages/shared
  -> packages/ai

packages/forge|writer|video|characters
  -> packages/shared

packages/ai
  -> packages/shared

packages/shared
  -> (no internal deps)
```

## Package Contents

Each package should include:

- package.json with explicit exports
- packages/*/src/ (source)
- dist/ (build output)
- tsconfig.json (local build)
- tsconfig.build.json (emit)

## Umbrella Package

The @magicborn/dialogue-forge package should re-export public APIs from domain packages to preserve existing consumer imports.

## Boundary Enforcement

- Dependency-cruiser or similar tooling should enforce import rules.
- TypeScript project references should prevent invalid cross-package imports.

## Host App

The host app owns:

- Next.js routes and UI
- PayloadCMS and other external integrations
- Adapter implementations

Domain packages must not import from the host app.

## Tooling (Scaffold)

- turbo.json added for task orchestration (not wired yet).
- pnpm-workspace.yaml added for future pnpm migration.

## Current State (Feb 4, 2026)

- apps/host contains the Next.js app.
- Domain source is extracted into packages/{shared,runtime,forge,writer,video,characters,ai}.
- packages/dialogue-forge re-exports domain APIs for compatibility.
- `@/` alias removed; use `@magicborn/<domain>/*` or relative host paths.


