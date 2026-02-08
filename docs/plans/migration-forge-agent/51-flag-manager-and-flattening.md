# Game flags and flattening (stats, state shape, variable storage)

This doc details how game state (including stats) is shaped, how it flattens into Yarn-compatible variables, and how complex we can get while staying maintainable. Linked from [50-game-state-and-player.md](50-game-state-and-player.md).

---

## ForgeGameState shape

- **Current:** [packages/shared/src/types/forge-game-state.ts](../../packages/shared/src/types/forge-game-state.ts) defines `ForgeGameState` as `{ flags: ForgeFlagState; characters?: ... }`.
- **Extended shape (documented):** Authoring and save format can use a **stats** key so stats are first-class, e.g. `{ flags: { [key: string]: boolean | number | string }, stats?: { [key: string]: number }, characters?: ... }`. The flag schema already has `FLAG_TYPE.STAT` and `valueType` / `defaultValue` in [packages/forge/src/types/flags.ts](../../packages/forge/src/types/flags.ts). So we can store `flags` for boolean/string quest and dialogue state, and `stats` for numeric state (gold, reputation, etc.); both flatten into the same variable storage.

---

## Flattening rules

Reference: [packages/forge/src/lib/game-player/game-state-flattener.ts](../../packages/forge/src/lib/game-player/game-state-flattener.ts).

- **Nested keys → flat key:** The flattener builds a dot path from the root (each object key appends `.key`). The path is then turned into a single variable name by replacing dots with the separator (default `_`). So `flags.quest_main` → `flags_quest_main`, `stats.gold` → `stats_gold`. Every top-level key is part of the path (e.g. `{ flags: { quest_main: 'started' } }` → path `flags.quest_main` → flat key `flags_quest_main`).
- **Values:** Only Yarn-compatible types are stored: boolean, number, string.
- **Stats and zero:** Stats often need to be 0 (e.g. gold). The current flattener’s `isTruthyValue` excludes numeric 0. For MVP we need stats to be present when 0. Options: (a) Add a config option to include numeric 0 for certain paths (e.g. `stats.*`), or (b) Add a global option like `includeFalsyNumbers: true` so all numbers are included (so `stats_gold: 0` exists in variable storage). **Decision:** Implement `includeFalsyNumbers` (or equivalent) so stats can be 0 in variable storage and in Yarn; required for Yarn Spinner compatibility. The schema can still define which keys are stats for UI/validation. For boolean false: MVP uses "unset = false"; if explicit `<<set $x = false>>` is needed, include falsy booleans in the flattener or export. See [52-yarn-spinner-variables-flattening-caveats.md](52-yarn-spinner-variables-flattening-caveats.md).

---

## Example flattened shape

```text
{
  "flags_quest_dragon": "started",
  "flags_dialogue_met_stranger": true,
  "stats_gold": 100,
  "stats_reputation": 5
}
```

All keys are valid Yarn variable names (no spaces, compatible with `$var`); values are bool, number, or string. The player’s variable storage is initialized from this flat map; conditions and setFlags use the same keys. With a config like `includeFalsyNumbers: true`, `stats_gold: 0` would also be stored when gold is 0.

---

## Complex examples (aligned with codebase)

The flattener in [game-state-flattener.ts](../../packages/forge/src/lib/game-player/game-state-flattener.ts) recurses over every top-level key of `ForgeGameState` and builds dot paths; each path becomes a flat key by replacing `.` with the separator (default `_`). Only Yarn-compatible values (boolean, number, string) are stored; today numeric `0` is omitted unless we add `includeFalsyNumbers` (or similar) as in the Stats and zero rule above.

### 1. Nested game flags (flat under `flags`)

Authoring state with mixed game flag types (quest, dialogue, achievement, stat) under a single `flags` object:

```json
{
  "flags": {
    "quest_dragon_slayer": "started",
    "quest_dragon_slayer_complete": false,
    "dialogue_met_stranger": true,
    "dialogue_seeks_knowledge": true,
    "achievement_first_quest": true,
    "item_ancient_key": true,
    "stat_reputation": 5,
    "stat_charisma": 10
  }
}
```

Flattened (path → key is `flags.<id>` → `flags_<id>`):

```text
flags_quest_dragon_slayer       = "started"
flags_dialogue_met_stranger     = true
flags_dialogue_seeks_knowledge  = true
flags_achievement_first_quest   = true
flags_item_ancient_key          = true
flags_stat_reputation           = 5
flags_stat_charisma             = 10
```

Note: `quest_dragon_slayer_complete: false` is excluded by the current flattener's `isTruthyValue` (only `true` is included for booleans). If we need "set to false" in variable storage, we'd either include falsy booleans or document that "unset" means false.

### 2. Nested stats (separate top-level `stats`, with optional nesting)

Authoring state with a dedicated `stats` object, and optionally nested groups (e.g. inventory vs character):

```json
{
  "flags": {
    "quest_main": "in_progress",
    "dialogue_met_stranger": true
  },
  "stats": {
    "gold": 100,
    "reputation": 5,
    "inventory": {
      "keys": 2,
      "potions": 0
    },
    "character": {
      "charisma": 10,
      "health": 100
    }
  }
}
```

Flattened (paths `stats.gold`, `stats.inventory.keys`, etc. → `stats_gold`, `stats_inventory_keys`, …):

```text
flags_quest_main           = "in_progress"
flags_dialogue_met_stranger = true
stats_gold                 = 100
stats_reputation            = 5
stats_inventory_keys        = 2
stats_character_charisma    = 10
stats_character_health      = 100
```

Important: with the current flattener, `stats.inventory.potions: 0` is **dropped** (numeric 0 is excluded). For MVP we want stats to be present when 0 (e.g. `stats_inventory_potions = 0`), hence the recommendation for an option like `includeFalsyNumbers: true` (or include numeric 0 for paths under `stats.*`).

### 3. Schema and flat variable names

The [flag schema](../../packages/forge/src/types/flags.ts) defines game flags by `id`, `type` (e.g. `FLAG_TYPE.QUEST`, `FLAG_TYPE.STAT`), and optional `valueType` / `defaultValue`. In conditions and setFlags we refer to variables by the **flat key** that the flattener produces. So if the schema has `{ id: 'quest_dragon_slayer', type: FLAG_TYPE.QUEST }` and state is under `flags`, the variable name used in the runner is `flags_quest_dragon_slayer`. If we kept a flat `flags` object keyed by schema id (e.g. `flags.quest_dragon_slayer`), the flat key is indeed `flags_quest_dragon_slayer`. Nested stats use the full path: schema id `stat_reputation` with state under `stats` → `stats_stat_reputation` or, if we store under `stats` with the same id, `stats_reputation`. The important contract is: **one flat namespace of variable names**; authoring can use nested structures for clarity, and the flattener produces a single key per value.

---

## Complexity vs maintainability

- **One flat namespace:** We keep a single convention: flatten any nested structure with a fixed separator. No reserved prefixes are required; the schema defines type (quest, stat, dialogue, etc.) and valueType for editor UI and optional validation. The flattener does not need to know flag types—it flattens any nested object.
- **Stats updates (MVP):** MVP is **set only**: set a variable to a value. `setFlags: string[]` on nodes/choices remains list of variable names; default value for boolean is `true`. For stats, the runner or schema can supply a default value (e.g. from FlagDefinition.defaultValue) when applying setFlags; if we need “set to 5” we can extend to a small payload per flag (e.g. value) later.
- **setFlags shape extension:** Support `SetFlagOp[]` with `{ id: string, value: boolean | number | string }` (e.g. `{ id: 'quest_main', value: 'started' }`, `{ id: 'stats_gold', value: 100 }`). Node data and export should support this; the [variable-handler](../../packages/forge/src/lib/yarn-converter/utils/variable-handler.ts) already has `formatSetCommand(flag, value)`—extend or add `formatSetFlagOps` so export emits `<<set $flatKey = value>>` per op. See [52](52-yarn-spinner-variables-flattening-caveats.md).
- **Later: increment/decrement:** Yarn supports `<<set $gold to $gold + 10>>`. We can add increment/decrement or expression-based set in the schema or in node/choice payload later (e.g. `SetFlagOp[]` with `{ id, value }` or `{ id, op: 'increment', delta }`). For MVP we don’t over-complicate: flatten one way, set one way; extend when needed.

---

## Summary

| Topic | MVP | Later |
|-------|-----|--------|
| Shape | `ForgeGameState`: flags + optional stats, characters | Same; extend with more keys if needed |
| Flattening | Nested → flat with separator; include numeric 0 for stats | Same |
| Set | setFlags as list of ids (default true) or **SetFlagOp[]** with `{ id, value }`; export emits `<<set $flatKey = value>>` per op | Optional: increment/decrement |
| Schema | Defines game flag types and valueType for editor | Optional validation in player |
