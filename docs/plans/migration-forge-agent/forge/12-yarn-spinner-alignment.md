# Yarn Spinner alignment

How our implementation fits the official Yarn Spinner ecosystem. Reference for migration and for forge-agent’s first-class Yarn support.

## Yarn Spinner concepts (official)

From [Yarn Spinner documentation](https://docs.yarnspinner.dev/):

- **Nodes** — Named blocks of dialogue (like scenes or beats). Our graph nodes become Yarn nodes; each node has a `title:` (node id) and content between `---` and `===`.
- **Lines** — Dialogue spoken by characters. Our CHARACTER node content and speaker map to `CharacterName: Line text`.
- **Options** — Player choices. Our PLAYER node choices map to `-> Option text` and jumps.
- **Commands** — Instructions to the game (`<<wait>>`, `<<set $var>>`, etc.). We emit these from setFlags, runtime directives, and handler logic.
- **Variables** — `$variableName`; we have flag schema and game state that flatten to Yarn variables.
- **Functions** — Custom logic; we support conditionals that map to `<<if>>` / `<<elseif>>` / `<<else>>` / `<<endif>>`.

**.yarn files** — Plain text; nodes separated by `===`; node header `title: NodeId`, then `---`, then content. Multiple .yarn files can live in a folder; Yarn Spinner project uses `.yarnproject` and `sourceFiles` / `excludeFiles` (see [Yarn Spinner project files](https://docs.yarnspinner.dev/write-yarn-scripts/yarn-spinner-editor/yarn-spinner-project-files)).

## Our node types → Yarn

| Our node type | Yarn mapping |
|---------------|---------------|
| CHARACTER | `Speaker: line text`; optional `<<set>>` / conditionals in content. |
| PLAYER | `-> Choice text` per choice; next node id for jump. |
| CONDITIONAL | `<<if>>` / `<<elseif>>` / `<<else>>` blocks; content and nextNodeId per block. |
| STORYLET | Our node jumps to another graph’s start; we **inline** that graph’s nodes into the same .yarn output when export has workspace context. In Yarn, that’s equivalent to multiple nodes in one file; we generate a single combined output. |
| DETOUR | Same as storylet but with return; we rewrite the inlined graph’s end nodes to `<<jump ReturnNodeId>>`. |
| PAGE (narrative) | Act, Chapter, and Page are all **page nodes** (different kinds of pages) in our system; linking is via the page node; user selects from pages available in the project. **Export contract:** only PAGE (and narrative Detour/Jump) appear; we drop Act/Chapter as separate export concepts—they exist as page nodes. When the root graph is narrative-only, export a **structural skeleton** with **blank nodes** (no dialogue, no choices). Emit as titled nodes or comments as needed. |

## Export pipeline (our logic to keep)

1. **prepareGraphForYarnExport** — Strip runtime-only nodes; build exportable node list; sanitize links to runtime nodes.
2. **Handler registry** — Character, Player, Conditional, Storylet, Detour handlers.
3. **Per-node export** — Handler receives node, YarnTextBuilder, optional YarnConverterContext. Output is `===`-delimited block(s).
4. **Context for storylet/detour** — `createWorkspaceContext(store)` provides `getGraphFromCache`, `ensureGraph`, `visitedGraphs` so we can inline referenced graphs and avoid cycles.
5. **NodeBlockBuilder / YarnTextBuilder** — Build `title:`, `---`, lines, `===`; add next node id, conditionals, choices, commands.

## Import pipeline

- Parse .yarn: split by `===`, parse `title:`, content after `---`.
- **determineNodeTypeFromYarn** — Heuristics (e.g. `-> ` → PLAYER; `<<if` blocks → CONDITIONAL or CHARACTER with conditionals).
- Handlers importNode(block, context) → ForgeReactFlowNode; we currently only implement Character, Player, Conditional; Storylet/Detour import “not yet implemented.”

## Duplicate node errors (Yarn Spinner)

If the same node title appears in more than one file (or we emit the same node id twice), Yarn Spinner reports “More than one node is named …”. We use node ids as stored (no prefix) when inlining; see [52-yarn-spinner-variables-flattening-caveats.md](52-yarn-spinner-variables-flattening-caveats.md). For migration roadmap and phases, see [54-migration-roadmap.md](54-migration-roadmap.md).

## References

- [Yarn Spinner project files](https://docs.yarnspinner.dev/write-yarn-scripts/yarn-spinner-editor/yarn-spinner-project-files) — sourceFiles, excludeFiles, duplicate node troubleshooting.
- [Writing Yarn in VS Code](https://docs.yarnspinner.dev/write-yarn-scripts/yarn-spinner-editor/writing-yarn-in-vs-code) — .yarn files, node names, variables, commands.
- [Scripting fundamentals](https://docs.yarnspinner.dev/write-yarn-scripts) — First steps and scripting.
