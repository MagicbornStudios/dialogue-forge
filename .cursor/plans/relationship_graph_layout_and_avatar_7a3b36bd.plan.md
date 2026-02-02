---
name: Relationship graph layout and avatar
overview: Fix container clipping, link/element z-order, active-character-centered layout with re-layout on add, and avatar image in graph nodes by aligning with sidebar/panel image URL and ensuring the paper and layout keep all nodes visible.
todos: []
---

# Relationship graph: container, z-order, layout, and avatar

## Issues to fix

1. **Container cutting off elements/edges** — Paper has fixed 800×600; wrapper can be smaller or content can extend past the paper. Need paper to fill the viewport (or be scrollable) so nothing is clipped.
2. **Links rendering on top of elements** — In JointJS, later-added cells render on top. Links are added after elements (or after load), so links appear above nodes. Elements should sit on top of links.
3. **Active character not centered; no re-layout** — Active character should be at the center of the graph; when adding new characters, run a layout so nodes are organized (e.g. radial: active in center, others around it).
4. **Avatar image not showing in graph nodes** — Sidebar and ActiveCharacterPanel use `character.avatarUrl || character.imageUrl` for the display image. The graph only passes `character.imageUrl` into the character element. We should pass the same display URL so the avatar spot shows the image when available.

---

## 1. Container: no clipping

**Cause**: Paper is created with fixed `width: 800`, `height: 600`. The wrapper div has `min-w-[800px] min-h-[600px] w-full h-full `and the outer div has `overflow-auto`. If the viewport is smaller, content is clipped; if the paper is smaller than the wrapper, we have dead space.

**Approach**:

- Size the paper to the **wrapper’s client dimensions** (with a minimum, e.g. 800×600) so the paper fills the visible area and we don’t clip the edges of the paper itself.
- Use a **ResizeObserver** on the wrapper to update paper dimensions when the container resizes: `paper.setDimensions(width, height)` (or recreate paper with new dimensions — JointJS v4 Paper may have `setDimensions`).
- Keep the outer scroll container as-is so that if the graph content (nodes) extends beyond the paper, we can either rely on the layout to keep nodes inside the paper or add a “fit” behavior later. Priority: paper size = wrapper size so the canvas isn’t cut off.

**Files**: [RelationshipGraphEditorBlank.tsx](src/characters/components/CharacterWorkspace/components/RelationshipGraphEditorBlank/RelationshipGraphEditorBlank.tsx)

- In the same `useEffect` where the paper is created: read `wrapper.getBoundingClientRect()` or `wrapper.clientWidth` / `clientHeight`, compute dimensions (with min 800×600), pass to `new dia.Paper({ width, height, ... })`.
- Subscribe to ResizeObserver on `wrapper`, and on resize compute new width/height and call `paper.setDimensions(width, height)` (or equivalent in JointJS v4). Clean up observer in the effect return.
- Ensure the created `paperContainer` div fills the wrapper (e.g. `width: 100%`, `height: 100%`) so the paper’s SVG scales/fills correctly.

---

## 2. Links under elements (z-order)

**Cause**: Graph add order determines render order; links added after elements (or restored after elements from JSON) appear on top.

**Approach**:

- After any change that affects which cells exist (initial load from JSON, or after `addRelationshipFromActiveToCharacter` adds a link), call **toFront()** on every element so nodes always render above links.
- Centralize this in a small helper, e.g. `bringElementsToFront(graph: dia.Graph)` that gets all elements and calls `el.toFront()` on each.

**Files**:

- Add a helper (e.g. in [RelationshipGraphEditorBlank/utils/](src/characters/components/CharacterWorkspace/components/RelationshipGraphEditorBlank/utils/) or in a new `utils/layout.ts`) that does `graph.getElements().forEach(el => el.toFront())`.
- In [RelationshipGraphEditorBlank.tsx](src/characters/components/CharacterWorkspace/components/RelationshipGraphEditorBlank/RelationshipGraphEditorBlank.tsx): after `graph.fromJSON(json)` and after the initial `graph.addCell(createCharacterElement(...))` (or placeholder), call the helper.
- In the ref’s `addRelationshipFromActiveToCharacter`: after `graph.addCell(link)`, call the helper (and then run layout — see below).

---

## 3. Layout: active in center, re-layout on add

**Approach**:

- **Layout rule**: Active character node is at the **center** of the paper; all other character nodes are arranged around it (e.g. in a circle or semicircle) so the graph reads as “active with relationships.”
- **When to run layout**:
- After **initial load** when we have an active character: place that single node at center. When we load from JSON with multiple cells, run layout to reposition so active is center and others orbit.
- When **adding a new character** via `addRelationshipFromActiveToCharacter`: after adding the new element and link, run layout so the new node gets a position on the circle and nothing overlaps.
- **Layout algorithm** (e.g. in `utils/relationshipGraphLayout.ts`):
- Input: `graph`, `paperWidth`, `paperHeight`, `activeCharacterId`.
- Get all elements (character cards); node size is fixed (e.g. 260×72 from characterElement).
- Find the element with id `character-${activeCharacterId}`; place it at center: `(paperWidth/2 - width/2, paperHeight/2 - height/2)`.
- Remaining elements: place in a circle (or arc) around the center with a reasonable radius so links don’t overlap. Option: distribute by angle (e.g. 360 / n for n others).
- Set position on each element via `element.set('position', { x, y })` (or `element.position(x, y)` per JointJS API).
- Do not move links; they will reconnect automatically if source/target ids are unchanged.

**Files**:

- **New**: [RelationshipGraphEditorBlank/utils/relationshipGraphLayout.ts](src/characters/components/CharacterWorkspace/components/RelationshipGraphEditorBlank/utils/) — export `runRelationshipGraphLayout(graph, paperWidth, paperHeight, activeCharacterId)`.
- **Editor**: After loading graph (from JSON or single node), call `runRelationshipGraphLayout(...)` with current paper dimensions and `activeCharacterId`. In `addRelationshipFromActiveToCharacter`, after adding the new element and link and bringing elements to front, call `runRelationshipGraphLayout(...)` again. Paper dimensions: use the same values passed to the Paper (or read from paper if available) so layout uses the same coordinate space.

---

## 4. Avatar image in character element

**Cause**: [createElement.ts](src/characters/components/CharacterWorkspace/components/RelationshipGraphEditorBlank/utils/createElement.ts) passes only `avatarUrl: character.imageUrl`. The sidebar and [ActiveCharacterPanel](src/characters/components/CharacterWorkspace/components/ActiveCharacterPanel.tsx) use `character.avatarUrl || character.imageUrl` for the display image. The Payload adapter sets `avatarUrl` from the `avatar` media relation and `imageUrl` from a direct field. So the graph should use the same display URL.

**Approach**:

- In `createCharacterElement`, pass **the same display URL** as the panel: `avatarUrl: character.avatarUrl ?? character.imageUrl ?? null` (or `character.avatarUrl || character.imageUrl`). No other change in the element definition; [characterElement.ts](src/characters/components/CharacterWorkspace/components/RelationshipGraphEditorBlank/elements/characterElement.ts) already uses `setAvatarUrl(avatarUrl)` and sets `avatarImage/xlinkHref`. If the image still doesn’t show (e.g. CORS with SVG images), that’s a separate follow-up (e.g. proxy or same-origin URLs).

**Files**: [RelationshipGraphEditorBlank/utils/createElement.ts](src/characters/components/CharacterWorkspace/components/RelationshipGraphEditorBlank/utils/createElement.ts) — when building attrs for `createCharacterCardElement`, set `avatarUrl: character.avatarUrl ?? character.imageUrl ?? undefined` (or equivalent so both fields are considered).

---

## File summary

| # | Action | File |
|---|--------|------|
| 1 | Size paper to wrapper; ResizeObserver → setDimensions | RelationshipGraphEditorBlank.tsx |
| 2 | Add bringElementsToFront(graph); call after load and after addRelationshipFromActiveToCharacter | New helper + RelationshipGraphEditorBlank.tsx |
| 3 | Add runRelationshipGraphLayout(graph, width, height, activeCharacterId); call after load and in addRelationshipFromActiveToCharacter | New utils/relationshipGraphLayout.ts + RelationshipGraphEditorBlank.tsx |
| 4 | Pass avatarUrl \|\| imageUrl into character element | utils/createElement.ts |

---

## Optional / follow-up

- **Pan & zoom**: If the graph grows large, add a scroller or zoom so users can pan; layout only needs to fit the current paper size for the “default” view.
- **Image CORS**: If avatar URLs are cross-origin and SVG `<image>` fails to load, the app may need to proxy images or use same-origin URLs; that’s outside this plan.