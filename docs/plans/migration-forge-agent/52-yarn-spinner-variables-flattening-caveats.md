# Yarn Spinner variables, flattening, and caveats

Why we flatten game state, how Yarn Spinner (and any VM) expects variables, caveats, and our decisions. Use this when implementing or reviewing the forge→Yarn pipeline and the player. Linked from [50-game-state-and-player.md](50-game-state-and-player.md) and [51-flag-manager-and-flattening.md](51-flag-manager-and-flattening.md).

---

## Why we flatten game state

- **Yarn Spinner has a single variable namespace.** Variables are `$name` where `name` is an identifier. There are no nested objects; values are boolean, number, or string. See [Yarn Spinner scripting fundamentals](https://docs.yarnspinner.dev/write-yarn-scripts/scripting-fundamentals) and variable/command docs.
- **Our authoring model is richer.** We have game flags by type (quest, dialogue, stat, item, achievement, title, global), optional nesting (e.g. `flags.quest_main`, `stats.inventory.gold`), and a flag schema with categories and value types. To feed a Yarn VM (or our own graph runner) we must **flatten** that structure into one map of string key → boolean | number | string.
- **One source of truth at runtime.** Whether we run a Yarn VM or our graph runner, we want a single variable storage. Flattening at init (and when loading save state) gives one namespace; conditions and `<<set>>` in Yarn (or setFlags in the graph) all refer to that same flat set of names.

So: **we flatten so that (1) Yarn-compatible consumers get a single variable namespace, and (2) our authoring can still use nested structures and a schema for the editor.**

---

## How Yarn Spinner expects variables

- **Declaration (optional):** Yarn can `<<declare $var = value>>` to declare and set. We don't have to emit declarations for every variable; the VM typically allows setting undeclared variables (behavior is runtime-dependent). For portability we can emit `<<declare>>` for known schema variables if we want strict compatibility.
- **Set:** `<<set $var = value>>` or `<<set $var to value>>`. Value can be literal (true/false, number, "string"). Yarn also supports expressions (e.g. `<<set $gold to $gold + 10>>`). Our export currently emits `<<set $flag = value>>` via [variable-handler.ts](../../packages/forge/src/lib/yarn-converter/utils/variable-handler.ts) (formatSetCommand, formatFlagsAsSetCommands).
- **Types:** Yarn variables are boolean, number, or string. Our flattening and flag schema already restrict to those types; we must not emit nested objects or null into the Yarn file.
- **Names:** Variable names in Yarn are identifiers (e.g. `$my_var`). Our flat keys use a separator (default `_`); we must ensure keys are valid (no spaces, no dots in the name). Our flattener produces keys like `flags_quest_main`, `stats_gold` — valid Yarn variable names.

So: **flattened keys become the Yarn variable names; values must be bool/number/string; our export emits `<<set $flatKey = value>>`.**

---

## Declarations in Yarn

In Yarn Spinner, `<<declare $var = value>>` **declares** a variable and sets its initial value. It can appear at the start of a node or file. Some Yarn runtimes use this for type/initialization; without it, the variable may be undefined until the first `<<set>>`.

**Decision:** Emit `<<declare>>` **only when export context includes a schema**. When a flag schema is available at export time, emit a block (e.g. at the start of the first node or a dedicated init node) of `<<declare $flatKey = default>>` for each schema variable, using the schema's `defaultValue` (or 0 / false / "" by valueType). If no schema at export, do not emit declarations; rely on "set before use" and document that consumers may need to init variables themselves. Lack of schema may also limit editor suggestions (see Variable suggestion system below).

---

## Variable names in the graph

In the graph, `setFlags` and conditions store a **variable identifier**. That can be either (A) a **schema id** (e.g. `quest_main`) from the flag manager, or (B) the **flat variable name** (e.g. `flags_quest_main`) that the flattener produces and that Yarn uses. If we store (A), export and runner must map id → flat key using the same path rules as the flattener (see [51](51-flag-manager-and-flattening.md)). If we store (B), the graph and Yarn always agree.

**Recommendation:** Store the same key that appears in Yarn (the **flattened key**). If the editor stores schema ids, the export and graph runner must map id → flat key using the same path rules as the flattener (see 51). Document the chosen convention in the converter and in 51.

---

## Caveats

### 1. Falsy values (0, false, empty string)

The current [game-state-flattener](../../packages/forge/src/lib/game-player/game-state-flattener.ts) **omits** numeric 0, boolean false, and empty string (isTruthyValue). So:

- **Stats that are 0** (e.g. gold) do not appear in the flattened map unless we add an option (e.g. `includeFalsyNumbers: true`). For Yarn, if we never emit `<<set $stats_gold = 0>>`, the VM may treat the variable as undefined until set. Our runner and any consumer must agree: "unset" vs "set to 0" if we don't fix the flattener.
- **Boolean false:** If we need "set to false" in variable storage, we must either include falsy booleans in flattening or document that "unset" means false for booleans.

**Decision:** Prioritize Yarn Spinner compatibility; users must be able to import valid Yarn into their games. Implement `includeFalsyNumbers` (or equivalent) so **stats can be 0** in flattened state and in Yarn. For booleans: "unset = false" for MVP unless we need explicit `<<set $x = false>>`; if we do, include falsy booleans in the flattener or in export. See 51.

### 2. Node id when inlining (storylet/detour)

**Decision: No prefix.** Use node ids as stored (leave blank; do not prefix with graph slug/title). Users add nodes via AI chat, drag-and-drop, or right-click; if only one node it is the start, otherwise the graph is empty nodes and edges. **Uniqueness is enforced in the editor** (graph-scoped or globally unique node ids) so that when we inline without prefix, duplicate node titles cannot occur. No need to validate at export for duplicates if we guarantee uniqueness at authoring time.

### 3. Missing referenced graph

**Decision: Fail the whole export and warn the user.** If a storylet/detour points to a graph that doesn't load (deleted, permission, error), do not emit a placeholder node. Fail the export and surface a clear warning so the user can fix the reference or restore the graph.

### 4. Variable names must match between export and runtime

Whatever flat key we use in the exported Yarn file (e.g. `flags_quest_main`) must be the same key we use when initializing variable storage from ForgeGameState (flattened) and when evaluating conditions / applying setFlags in the graph runner. The flag schema and editor may use "logical" ids (e.g. `quest_main`); the **variable name in Yarn and in storage is the flattened key**. Document this in the converter and in 51.

### 5. Yarn VM vs our graph runner

We **do not run a Yarn VM** for our player (see [50-game-state-and-player.md](50-game-state-and-player.md) — Runtime: direct graph execution). So "how the Yarn VM handles variables" matters for:

- **Export:** The .yarn file we produce must be valid and use variable semantics a Yarn VM would understand (same types, same names).
- **Third-party use:** If someone runs our exported .yarn in a Yarn VM, they need to provide a variable storage that matches our flat keys and types. Our docs (50, 51, this doc) describe that contract.

We don't need to implement VM-specific behavior (e.g. declaration order, scoping) beyond "flat map of string → bool/number/string."

### 6. Narrative graph export

**Decision:** When the root graph is **narrative-only** (Page, Detour, Jump), export produces a **structural skeleton** only: the same graph shape with **blank nodes** (no dialogue lines, no choices). Narrative nodes are just blank nodes in Yarn form; it is the normal graph structure, not per-node dialogue content.

### 7. Variable suggestion system (requirement)

We need a **substantial suggestion system** for variables and conditions—similar to Appsmith and other low-code tools. **Goal:** Reference variables with suggestions in condition fields, setFlags, and other inspectors (values, conditions). Support **Yarn Spinner operators** and a **universal** way to suggest variables/expressions. When a flag schema is available, suggestions can be driven by schema (variable names, types, defaults). **Without schema, suggestions may be limited**—investigate impact on condition fields and value inputs. Plan for a reusable suggestion/autocomplete layer across condition inputs, setFlags value inputs, and any inspector that needs variable or value suggestions. Status: requirement; significant planning and implementation. See [54-migration-roadmap.md](54-migration-roadmap.md) Phase 3/4.

### 8. Game player and Yarn runtime directives (planning)

Yarn Spinner has runtime directives and concepts (e.g. line metadata, presenters, behavior) that describe how content is presented. We should **investigate** which map to our game player (presentation, interactivity); they may be too rigid for our graph-first player. **Significant planning is needed for the game player** (presentation and interactivity) as a separate effort from export. Document as a planning dependency. See [50-game-state-and-player.md](50-game-state-and-player.md).

---

## Decisions (summary)

| Topic | Decision |
|-------|----------|
| **Flattening** | One flat namespace; dot path → separator (default `_`). Schema defines types for editor; flattener is type-agnostic. |
| **Stats and 0** | Implement `includeFalsyNumbers` so stats can be 0 in variable storage and in Yarn. Prioritize Yarn Spinner compatibility. |
| **Boolean false** | MVP: "unset = false"; if explicit `<<set $x = false>>` needed, include falsy booleans in flattener or export. |
| **Export format** | Emit `<<set $flatKey = value>>`; variable names = flattened keys. Conditions in Yarn use same names. |
| **Declarations** | When flag schema available at export, emit `<<declare $flatKey = default>>` for schema variables (start of file or init node) for VM compatibility. |
| **Variable names in graph** | Prefer storing the flat key (same as Yarn). If storing schema id, export/runner must map id → flat key per flattener rules (51). |
| **Inlining** | No prefix; use node ids as stored. **Enforce unique node ids** in the editor (graph-scoped or global) so duplicates cannot occur when inlining. Fail export if referenced graph does not load; warn the user. |
| **Narrative export** | When root graph is narrative-only (Page, Detour, Jump), export a **structural skeleton** with blank nodes (no dialogue, no choices). |
| **setFlags shape** | Support explicit value per flag: e.g. `SetFlagOp[]` with `{ id: string, value: boolean | number | string }` (e.g. `{ id: 'quest_main', value: 'started' }`, `{ id: 'stats_gold', value: 100 }`). Export emits `<<set $flatKey = value>>` per op. See 51 and variable-handler (formatSetCommand supports value). |
| **Execution** | We execute the graph directly (no WASM/VM); variable storage is initialized from flattened game state. Yarn export is for portability and editor compatibility. |

---

## References

- [50-game-state-and-player.md](50-game-state-and-player.md) — Game state, variable storage, graph runner, no WASM.
- [51-flag-manager-and-flattening.md](51-flag-manager-and-flattening.md) — Game flags, flattening rules, complex examples.
- [Yarn Spinner documentation](https://docs.yarnspinner.dev/) — Variables, `<<set>>`, scripting.
- [packages/forge/src/lib/yarn-converter/utils/variable-handler.ts](../../packages/forge/src/lib/yarn-converter/utils/variable-handler.ts) — formatSetCommand, formatFlagsAsSetCommands.
- [packages/forge/src/lib/game-player/game-state-flattener.ts](../../packages/forge/src/lib/game-player/game-state-flattener.ts) — Flattening implementation.
