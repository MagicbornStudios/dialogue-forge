# Runtime

## Overview
Runtime concepts (frames, directives, execution status) are defined in shared types for use by tooling or a future playback feature. The **runtime package** and **GamePlayer** playback UI have been removed.

## Current state
- **Shared types** ([packages/shared/src/types/runtime.ts](packages/shared/src/types/runtime.ts)): `RUNTIME_DIRECTIVE_TYPE`, `FRAME_KIND`, `EXECUTION_STATUS`, etc. These remain for Yarn export (e.g. stripping runtime directives) and any future execution/playback work.
- **Yarn conversion** ([packages/forge/src/lib/yarn-converter/](packages/forge/src/lib/yarn-converter/)): Independent of the old runtime package; uses shared runtime constants where needed (e.g. `prepareGraphForYarnExport`).
- **Playback**: There is no in-app dialogue playback or GamePlayer; the previous runtime engine and PlayView were removed.

## When to edit
- **Runtime constants or types** (directives, frame kinds) → packages/shared/src/types/runtime.ts.
- **Yarn export behavior** (what gets stripped or preserved) → packages/forge/src/lib/yarn-converter/.

## Related docs
- [Forge](../forge.md)
- [Dialogue domain and Yarn](../architecture/dialogue-domain-and-yarn.md)
- [Architecture graphs](../architecture/graphs/README.md)
