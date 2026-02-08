# Data Access Conventions

## Current Pattern (Forge + Writer)

Forge and Writer no longer use host-implemented data adapters. Data access is package-owned and hook-driven.

- Host provides one payload client through `ForgePayloadProvider`.
- Forge data hooks live in `packages/forge/src/data/forge-queries.ts`.
- Writer page/comment hooks live in `packages/writer/src/data/writer-queries.ts`.
- Components call hooks directly (`useForgeGraphs`, `useUpdateForgeGraph`, `useWriterPages`, `useCreateWriterComment`, etc.).

## Host Responsibility

The host app should only configure providers:

- `QueryClientProvider` (React Query)
- `ForgePayloadProvider` with the payload/API client

Host code should not build adapter objects for Forge/Writer.

## Package Responsibility

- Keep query keys, fetchers, mappers, and mutations inside the owning package.
- Keep non-React helpers as small API abstractions (`createPage`, `updateGraph`) where needed for draft/commit utilities.
- Avoid importing host app modules from packages.

## Transitional Note

Other domains (for example Theme/Characters) may still use adapter contracts until they are migrated to the same provider + hook model.
