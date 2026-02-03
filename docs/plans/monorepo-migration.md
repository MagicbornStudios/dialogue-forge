# Monorepo Migration Plan

This plan turns the repo into a packages + apps monorepo while preserving the Next.js host app and enforcing domain boundaries.

## Phase 0: Conventions and Target Architecture (Done when docs exist)

- [ ] Add docs/conventions/* for repo structure, coding conventions, and adapters.
- [ ] Add docs/architecture/monorepo.md for target package graph.
- [ ] Update boundary docs to reference packages.

Acceptance:
- New docs are present and linked from AGENTS.md.

## Phase 1: Workspace Scaffolding

- [ ] Add workspace root package.json (private) with workspaces (apps/*, packages/*).
- [ ] Introduce packages/ and apps/ directories.
- [ ] Move Next.js app to apps/host (app/, components/, styles/, public/).
- [ ] Keep the current library under packages/dialogue-forge (move src/, bin/, dist/, package.json).
- [ ] Update Next.js config, tsconfig paths, and scripts to work from apps/host.

Acceptance:
- npm install works at repo root.
- npm run build succeeds for apps/host.
- npm run build:lib succeeds for packages/dialogue-forge.

## Phase 2: Domain Package Extraction

- [ ] Extract packages/shared from dialogue-forge/src/shared.
- [ ] Extract packages/runtime from dialogue-forge/src/forge/runtime.
- [ ] Extract packages/forge, packages/writer, packages/video, packages/ai, packages/characters.
- [ ] Update imports to use package names.
- [ ] Update umbrella package exports in packages/dialogue-forge.

Acceptance:
- Typecheck succeeds across packages.
- No cross-domain imports outside allowed graph.

## Phase 3: Tooling and Guardrails

- [ ] Update dependency-cruiser rules to use packages/* paths.
- [ ] Add project references across packages for typecheck.
- [ ] Add CI scripts for build/test per package.

Acceptance:
- check:arch enforces package boundaries.
- CI can build the host app and packages independently.

## Phase 4: Publishing

- [ ] Configure package exports and build outputs.
- [ ] Update release flow for multiple packages.

Acceptance:
- npm pack succeeds for each package.
- Consumers can install @magicborn/dialogue-forge without path changes.
