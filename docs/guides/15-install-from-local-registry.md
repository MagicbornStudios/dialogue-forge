---
title: 15 - Install from local registry (consumer)
created: 2026-02-08
updated: 2026-02-08
---

# 15 - Install from local registry (consumer)

## What

Install `@forge/*` and `@twick/*` packages from a running Verdaccio instance published by `forge-agent`.

## Prerequisites

- Verdaccio is running at `http://localhost:4873` from the `forge-agent` repo.
- Consumer repo uses pnpm.

## Steps

1. Configure consumer `.npmrc`:

```ini
@forge:registry=http://localhost:4873
@twick:registry=http://localhost:4873
```

2. Add dependency in consumer `package.json`:

```json
{
  "dependencies": {
    "@forge/dev-kit": "^0.1.0"
  }
}
```

3. If published `@forge/dev-kit` still references `workspace:*` for internals, add root overrides:

```json
{
  "pnpm": {
    "overrides": {
      "@forge/ui": "^0.1.0",
      "@forge/shared": "^0.1.0",
      "@forge/agent-engine": "^0.1.0"
    }
  }
}
```

4. Install packages:

```bash
pnpm install --no-frozen-lockfile
```

5. Use dev-kit in app code:

```ts
import { EditorShell, DockLayout } from '@forge/dev-kit';
```

Optional bridge file pattern used here:
- `apps/studio/lib/forge/dev-kit-bridge.ts`

## Troubleshooting

- `E409 Conflict` on auth/login: re-login against Verdaccio in publisher repo.
- Registry unavailable: confirm `forge-agent` Verdaccio terminal is running on `4873`.
- `workspace:*` resolution failures: add the `pnpm.overrides` block above.

## Related

- `../plans/migration-forge-agent/00-index.md`
- `20-vendor-tweakcn.md`
