Understood. If you are committing to **BabylonJS + Babylon Editor**, you can ship **Behavior A** quickly, without hand-rolling an editor, and still keep a clean runway to “real” 3D scenes with VFX later.

Below is the concrete plan that fits your current Forge architecture (narrative graph + storylet graphs, direct execution, PayloadCMS + ImageKit).

---

## 1) The non-negotiable boundary

### Execution engine (Forge)

* Owns: current node, call stack (storylets/detours), flags/variables, choice filtering, next-node selection.
* Your existing analysis already models PLAYER choice filtering + storylet graph resolution clearly.  

### Scene runtime (Babylon)

* Owns: visuals and animation playback only.
* Never decides branching.
* Receives “scene cues” from the execution engine.

This is exactly what makes Behavior A shippable: **choices/conditions are UI + logic; the scene persists unless a node explicitly cues a change**.

---

## 2) What we ship first: Behavior A in Babylon

### Behavior A rules

* **Character node:** show dialogue; optionally apply scene cues (expression swap, play anim group, trigger FX).
* **Player node:** show choices overlay; do not alter scene by default; conditions only filter/disable choices.
* **Conditional nodes:** routing only; no visual change.

This lines up with your current GamePlayer direction and direct execution approach. 

---

## 3) Babylon Editor: use it as your “studio” out of the box

Babylon Editor gives you:

* **Built-in Next.js templates** (so it fits your stack) ([editor.babylonjs.com][1])
* A scene composition workflow that imports common formats (.glb/.gltf/.fbx/etc.) ([editor.babylonjs.com][2])
* A “generate output” pipeline that bakes assets / scripts maps / scene output ([editor.babylonjs.com][3])

### Practical recommendation on file format

For runtime portability, prefer **glTF / .glb** as the authored/exported artifact. Babylon’s “.babylon” export/import has known edge cases and version coupling concerns in real projects. ([Babylon.js][4])

---

## 4) The key to scaling: a VN Stage Template scene

Create a Babylon scene template (in Editor) with **named anchors**. Your runtime code will locate these anchors by name and apply changes deterministically.

### Required anchors (minimum)

* `BG` (background plane/mesh)
* `CHAR_LEFT`, `CHAR_CENTER`, `CHAR_RIGHT` (character root transforms)
* `FX_A`, `FX_B` (optional effect anchors)
* `CAM_RIG` (camera parent; camera itself can be child)

### Optional but recommended

* `LIGHT_RIG`
* `HIT_TARGET_LEFT/CENTER/RIGHT` (for “spell hits target”)
* `UI_SAFEFRAME` helper mesh (editor-only)

With this template, your node doesn’t “have visuals” directly; it references **assets + cues** that modify these slots.

---

## 5) Data model: project defaults, graph defaults, node overrides

You already treat narrative graph as the “main graph” and storylets as nested graphs with their own editing experience. 

Use a strict inheritance stack:

1. **Project Visual Defaults**
2. **Graph Visual Defaults** (narrative graph vs storylet graph)
3. **Node Visual Overrides** (optional per node)

### What to store on graphs/nodes

Store *references*, not giant scene state blobs.

**Graph-level**

* `visualSceneId` (Payload doc reference)
* `visualPolicy` (inherit/override/restore on exit)

**Node-level**

* `sceneCueBundleId` (optional) OR inline `sceneCues` array

This is compatible with your current “graphs cached by id + resolver” workflow in the workspace store. 

---

## 6) The “Cue Vocabulary” (small and stable)

Keep cues minimal so you ship fast and don’t paint yourself into a corner.

```ts
export type SceneCue =
  | {
      type: "SET_BACKGROUND";
      assetId: string; // Payload media/scene asset id
    }
  | {
      type: "SET_CHARACTER_ASSET";
      slot: "LEFT" | "CENTER" | "RIGHT";
      assetId: string; // could be glb, or a texture for a plane, etc.
    }
  | {
      type: "SET_CHARACTER_VARIANT";
      slot: "LEFT" | "CENTER" | "RIGHT";
      variantId: string; // e.g., "angry", "sad", or a Payload variant doc id
    }
  | {
      type: "PLAY_ANIMATION";
      target: "BG" | "CHAR_LEFT" | "CHAR_CENTER" | "CHAR_RIGHT" | "SCENE";
      animationGroup: string;
      loop?: boolean;
    }
  | {
      type: "TRIGGER_FX";
      anchor: "FX_A" | "FX_B" | "HIT_LEFT" | "HIT_CENTER" | "HIT_RIGHT";
      fxId: string; // Payload fx asset id (could map to particle system name)
    }
  | {
      type: "SET_VALUE";
      targetPath: string; // escape hatch, e.g. "CAM_RIG.zoom"
      value: number | string | boolean;
    };
```

Behavior A only needs:

* `SET_CHARACTER_VARIANT` (optional)
* `PLAY_ANIMATION` (optional)
* `TRIGGER_FX` (optional)

Everything else can be incremental.

---

## 7) Payload + ImageKit: make 3D first-class, not a one-off

You are already using Payload and want storage “seamless” via ImageKit. That’s correct: treat 3D files the same way you treat images—Upload field → ImageKit URL → runtime loads from CDN.

### Collections you actually need (minimal)

1. **VisualScenes**

* `name`
* `project`
* `sceneFile` (upload: .glb)
* `previewImage` (upload)
* `declaredSlots` (json or array of strings; optional)

2. **CharacterVariants** (optional, if you want variant browsing)

* `character`
* `variantName` (happy/angry)
* `asset` (either texture for plane OR glb for character variant OR material override doc)

Everything else can remain in `media` if you want; specialized collections are for better UX and indexing.

---

## 8) Runtime integration in your app (Next.js)

### Where this plugs into your current architecture

* Your Forge workspace store already has graph identity + a cache-first resolver and emits graph change events. 
* Your GamePlayer will:

  1. Load the active graph (narrative or storylet)
  2. Resolve the effective `visualSceneId` (inheritance)
  3. Mount Babylon canvas + load that scene file
  4. Run the execution engine
  5. On each node step:

     * apply scene cues (if any)
     * update Dialogue UI / Choices UI

### SSR note

Babylon must run client-side. Babylon Editor’s default Next.js orientation and the general Babylon-on-canvas model align with that approach.

---

## 9) Storylets: “their own scenes” with clean enter/exit semantics

You already have storylets/detours modeled as “execute referenced graph, then return.” 

Add a storylet visual policy:

* **EnterMode**

  * `INHERIT_SCENE`: use current narrative scene
  * `OVERRIDE_SCENE`: load storylet’s scene

* **ExitMode**

  * `RESTORE_SNAPSHOT`: revert to pre-storylet scene state
  * `PERSIST_RESULT`: keep the storylet’s scene (rare, but useful)

For MVP, pick:

* `OVERRIDE_SCENE` + `RESTORE_SNAPSHOT` as the default for storylets that are “vignettes”
* `INHERIT_SCENE` for storylets that are “logic subgraphs”

---

## 10) What you do next (concrete checklist)

### Step 1: Create the Babylon VN Stage Template

* Build a simple scene in Babylon Editor with the anchor names listed above.
* Export as `.glb`.
* Upload as a `VisualScene` doc in Payload.

### Step 2: Implement `BabylonStage` component (render-only)

* Load `VisualScene.sceneFile.url` via `SceneLoader`.
* Resolve anchor nodes by name.
* Expose an imperative API: `applyCues(cues: SceneCue[])`.

### Step 3: Implement `SceneCueApplier`

* Map cue → Babylon operations:

  * variant swap (texture/material swap or mesh visibility toggle)
  * play animation group
  * trigger particle system

### Step 4: Wire it into the execution loop (Behavior A)

* Character node: apply cues, then show dialogue
* Player node: compute choices (conditions), show overlay, wait for selection
* Conditional: route only

### Step 5: Authoring UI (later)

* In NodeEditor: “Visual” tab with:

  * scene cue list editor (simple)
  * dropdowns for variant and animationGroup (from scene introspection)

---

If you want to move immediately, I can produce the exact module layout and the TypeScript interfaces that fit your existing Forge types (including where to extend `ForgeNode` / graph docs cleanly), and the runtime cue-applier mapping patterns that avoid brittle “magic strings” while still using Babylon’s anchor naming convention.

[1]: https://editor.babylonjs.com/?utm_source=chatgpt.com "Babylon.js Editor"
[2]: https://editor.babylonjs.com/documentation/composing-scene?utm_source=chatgpt.com "Babylon.js Editor Documentation"
[3]: https://editor.babylonjs.com/documentation?utm_source=chatgpt.com "Babylon.js Editor Documentation"
[4]: https://forum.babylonjs.com/t/regarding-babylon-file-format-scene-import-export-using-editor/44852?utm_source=chatgpt.com "Regarding .babylon file format (scene import/export using editor) - Questions - Babylon.js"
