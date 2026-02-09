# Game player: tech, design, one template, roadmap

Single place for game player **tech and design** (graphs, game state, flags), **one opinionated MVP template**, **decisions**, **open questions**, and **roadmap** so "what's next" is clear.

**Next recommended task:** Task 4 (template + characters/presentation directives) - Task 1/2/3/5 are implemented in dialogue-forge.

---

## Scope and goals

- Game player runs **dialogue graphs** with **game state** (flags) and optional **characters/assets**. Export produces Yarn; playback is **graph-first** (no Yarn VM). One **opinionated template** for MVP: all games share the same look and load the same kinds of data (graph, characters, flags).

---

## How it works with graphs, state, and flags (tech summary)

- **Inputs:** ForgeGraphDoc (or storylet subgraph), start node id; initial game state (ForgeGameState); optional flag schema; optional character/list assets (portraits, etc.).
- **Variable storage:** Flat key → bool/number/string; initialized from **flattened** game state ([game-state-flattener](../../../../packages/forge/src/lib/game-player/game-state-flattener.ts)); same namespace for conditions and setFlags. Ref: [50-game-state-and-player.md](50-game-state-and-player.md), [51-flag-manager-and-flattening.md](51-flag-manager-and-flattening.md), [52-yarn-spinner-variables-flattening-caveats.md](52-yarn-spinner-variables-flattening-caveats.md).
- **Graph runner:** Traverse graph; at each node: evaluate conditions, apply setFlags, emit events (EnterNode, Line, Choices, SetVariables, WaitForUser, End). Ref: 50 (Runtime, MVP scope), [execution-strategy.md](../../../../packages/forge/src/lib/game-player/docs/execution-strategy.md) Option B.
- **Presentation:** Scene (background, character slots), textbox (speaker + content), choices (buttons). Driven by node (characterId, content, presentation, runtimeDirectives). Ref: 50 (Layout and behaviors, Scene management).

---

## One opinionated MVP template (design)

- **Decision:** One canonical **visual and interaction template** for the game player. All games look and behave the same way (e.g. textbox position, choice style, character slot layout, typography). Recognizable as "our" template.
- **Template contract (inputs the template consumes):**
  - **Graph** (or resolved storylet graph) + start node.
  - **Initial game state** (flattened into variable storage).
  - **Characters** (id → name, optional portrait/avatar ref) for speaker display and slots.
  - **Optional:** Flag schema (for debug or UI hints); assets (backgrounds, portraits) by id.
- **Template behavior:** Single layout (e.g. full-screen background, N character slots, bottom textbox, choice buttons); one font/size/color scheme; one transition style (e.g. fade, slide). No theme switcher or alternate skins for MVP.
- **Open for discussion:** Exact layout (e.g. 2 vs 3 character slots), textbox style (visual novel vs chat), choice placement. Document choices once decided.

---

## Decisions (to lock in doc)

- **Pixi'VN** as the dialogue/game player engine. React for UI (menus, HUD). One **composition** format (elements + timing + animation) as the shared contract between player and animation editor (timeline).
- Graph runner feeds composition or Pixi'VN narrative input. **Forge graph → adapter → composition/Pixi'VN story format.**
- Graph-first execution (no Yarn VM); variable storage = flattened game state; conditions/setFlags use same flat keys as Yarn export (52). One template for MVP; no multiple themes. See 50 for full tech stack (Framer Motion, particles, frame cycling, Electron). Optional: Yarn runtime directives investigation (50, 52).

---

## Open questions (for tech/design discussion)

1. **Composition schema:** Exact fields and ownership (we own it; Pixi'VN consumes it or we export from their state?).
2. **Forge graph → Pixi'VN:** Adapter shape — graph → composition → Pixi'VN, or graph → their narrative/JSON API directly?
3. **Animation editor:** Same composition format as player input, or import from Pixi'VN state? How does timeline get keyframes (from composition only vs. from engine state)?
4. **Electron + Pixi'VN:** Any packaging or native-module constraints to validate early.
5. Exact template layout: number of character slots, textbox position, choice UI.
6. Where does the template live: same repo as editor, or separate package?
7. How does "play" launch: from editor (current graph + current game state) vs standalone URL with graph id + state?
8. Save/load: persist variable storage only, or full game state blob?
9. Storylet/detour at runtime: does player resolve referenced graphs on the fly or only run a pre-resolved tree?

---

## Roadmap and task breakdown ("what's next")

Ordered slices; pick the next item and execute or discuss. After each slice, update Done/Next below and MIGRATION.md per [01-agent-strategy-migration.md](../strategy/01-agent-strategy-migration.md).

- **Task 1 — Variable storage and flattener:** Implement variable storage interface; init from flattened game state (use or port game-state-flattener); includeFalsyNumbers for stats. Ref: 50, 51.
- **Task 2 — Graph runner core:** Traverse ForgeGraphDoc from start node; evaluate conditions (all operators); apply setFlags (default true for boolean; extend to value per flag per 51/52); emit EnterNode, Line, Choices, SetVariables, WaitForUser, End. Ref: 50, execution-strategy Option B.
- **Task 3 — Pixi'VN + React UI (template shell):** Pixi'VN for scene (background, character slots, sprites, frame cycling); React for layout (textbox, choice area, menus). Composition-driven: template consumes composition format; subscribe to runner events; show speaker + content, wait for advance; show choices, on select apply setFlags and navigate. No theming; one style. Ref: 50 Layout and behaviors, Tech stack.
- **Task 4 — Template + characters and presentation:** Resolve characterId → name/portrait; apply presentation (backgroundId, portraitId) and runtimeDirectives (BACKGROUND, PORTRAIT, AUDIO_CUE) in template. Ref: 50 Scene management.
- **Task 5 — Wire play from editor:** Editor "Play" passes graph + initial game state + characters (and optional schema) to player; document flow. Ref: 50 Next step 6.
- **Task 6 — Save/load (optional for MVP):** Persist variable storage (or full state) and restore for "continue" if in scope.

---

## Done

- Task 1: Variable storage + flattening path implemented (`variable-storage.ts`, flattener `includeFalsyNumbers`).
- Task 2: Graph runner core implemented (`graph-runner.ts`, runner events, storylet/detour call handling).
- Task 3: Pixi'VN + React shell implemented (`PixiVNPlayerShell`, `GamePlayerOverlay`, controller hook).
- Task 5: Forge workspace Play wiring implemented (menu action, player modal, server composition route, Studio callback).

---

## Next

1. Task 4 - Apply full presentation/runtime-directive mapping (BACKGROUND, PORTRAIT, AUDIO_CUE) from composition into shell rendering.
2. Task 6 - Save/load persistence for variable storage and resume flow.

---

## References

- [50-game-state-and-player.md](50-game-state-and-player.md) — Full design, layout, scene management.
- [51-flag-manager-and-flattening.md](51-flag-manager-and-flattening.md) — Flags, flattening, setFlags.
- [52-yarn-spinner-variables-flattening-caveats.md](52-yarn-spinner-variables-flattening-caveats.md) — Variable names, caveats.
- [54-migration-roadmap.md](../forge/54-migration-roadmap.md) — Phase 5, game player.
- [packages/forge/src/lib/game-player/game-state-flattener.ts](../../../../packages/forge/src/lib/game-player/game-state-flattener.ts) — Flattener implementation.
- [packages/forge/src/lib/game-player/docs/execution-strategy.md](../../../../packages/forge/src/lib/game-player/docs/execution-strategy.md) — Option B (direct execution).


- [67-pixivn-composition-contract-and-adapter.md](67-pixivn-composition-contract-and-adapter.md) - Implemented contract, adapter, route, and player wiring details.
