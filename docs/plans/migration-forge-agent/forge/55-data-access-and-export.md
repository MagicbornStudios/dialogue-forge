# Data access and export resolution

How forge-agent loads graph data and how full Yarn export is performed. **No data adapters**; use **React Query** with the **Payload CMS SDK**.

## Data access

- **Do not use data adapters.** Any place that needs graph CRUD or list-by-project/kind should use **React Query hooks** that call the **Payload CMS SDK** directly.
- **Host/source:** If the app can connect to Payload, create and use these hooks where graph data is needed. No restriction to a single host.
- **Hooks (example pattern):**
  - `useForgeGraph(id: number | null)` — `payloadSdk.findByID({ collection: 'forge-graphs', id })`; query key for cache.
  - `useForgeGraphs(projectId, kind)` — `payloadSdk.find({ collection: 'forge-graphs', where: { project: projectId, kind } })` for graph list/picker.
  - Mutations: `useCreateForgeGraph()`, `useUpdateForgeGraph()` using `payloadSdk.create` / `payloadSdk.update` with `queryClient.invalidateQueries` for cache invalidation.
- **Payload collection (forge-graphs):** Documents have Payload document **id** (numeric), plus e.g. `project`, `kind`, `title`, `flow` (JSON). `flow` contains `nodes` (each: id string, type string, position { x, y }, data…) and `edges` (id, source, target). Graph id in forge-agent is the Payload doc id: use **number** everywhere (e.g. `id: number` in hooks, `Set<number>` for `visitedGraphs`, `targetGraphId`).

## Export resolution

- **Server-side.** Full Yarn export (with storylet/detour resolution and inlining) is performed **on the server**. The server loads all referenced graphs via Payload, resolves cycles (e.g. `visitedGraphs`), and produces the complete Yarn string. The client cannot perform full resolution alone unless it has all graphs and resolution logic; the intended design is **server-side full export**.
- **Preview (client):** The client can show a **preview** of Yarn without full resolution—e.g. current graph only, or best-effort inlining if the client has a subset of graphs. Preview is for authoring feedback; it may contain placeholders or missing refs.
- **Full export:** Client requests full export from the server (or sends the root graph id and the server loads the rest). Server returns the complete, self-contained Yarn string.

## Possible issues and gaps

- **Preview vs full:** Clearly define what "preview" contains (e.g. current graph only, or inlined best-effort with placeholders) vs "full export" (server-resolved, complete Yarn) so implementers and product are aligned.
- **Graph ids:** In Payload-backed forge-agent, graph id = number. When porting from dialogue-forge (where graphId is sometimes string from node data or URL), standardize on number so cycle detection and cache keys are consistent. See [54-migration-roadmap.md](54-migration-roadmap.md) (Known issues and graph ids).

## References

- [54-migration-roadmap.md](54-migration-roadmap.md) — Phases 2/3 (server-side export, data access).
- [30-plan-yarn-and-graph-types.md](30-plan-yarn-and-graph-types.md) — Yarn port; graph data and export resolution.
- [53-forge-yarn-export-goal-next-steps.md](53-forge-yarn-export-goal-next-steps.md) — Export goal and next steps.
