# Adapters and Contracts

Adapters are contracts to external systems. Domain packages define adapter interfaces only. The host app implements them.

## Rules

- Define adapter interfaces in the owning domain package.
- Do not import host types inside domain packages.
- Adapters must be pure TypeScript interfaces or type aliases.
- Hosts implement adapters in apps/host and pass them into workspace components.

## Suggested Folder Pattern

```
packages/<domain>/src/adapters/
  <domain>-adapter.ts
  index.ts

apps/host/app/lib/<domain>/
  <domain>-adapter.ts  // PayloadCMS or other system wiring
```

## Example (Forge)

```ts
// packages/forge/src/adapters/forge-adapter.ts
export interface ForgeAdapter {
  listGraphs(projectId: string): Promise<ForgeGraphDoc[]>;
  saveGraph(input: ForgeGraphDoc): Promise<ForgeGraphDoc>;
  deleteGraph(id: string): Promise<void>;
}
```

```ts
// apps/host/app/lib/forge/forge-adapter.ts
import type { ForgeAdapter } from '@magicborn/forge';

export const forgeAdapter: ForgeAdapter = {
  async listGraphs(projectId) {
    // PayloadCMS implementation
  },
  async saveGraph(input) {
    // PayloadCMS implementation
  },
  async deleteGraph(id) {
    // PayloadCMS implementation
  }
};
```

## Why This Matters

- Keeps domain packages portable.
- Prevents hard coupling to PayloadCMS or Next.js.
- Makes it safe to reuse packages in other hosts.
