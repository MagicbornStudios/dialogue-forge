# Out of scope: Edge-drop

**Do not migrate edge-drop functionality.** It never worked in this system. Use standard React Flow connect (drag from handle to handle) or create-node-from-palette + explicit connect UI instead.

## Edge-drop surface (do not port)

List every file and symbol so agents and humans do not copy them.

### Session state and types

- **packages/forge/src/lib/graph-editor/hooks/useForgeEditorSession.tsx**
  - `EdgeDropMenuState` type
  - `edgeDropMenu` in session state
  - Initial state `edgeDropMenu: null`
- **packages/forge/src/lib/graph-editor/hooks/useEdgeDropBehavior.ts**
  - Entire hook: `useEdgeDropBehavior`, local `edgeDropMenu` / `setEdgeDropMenu`, `onConnectEnd` that opens menu
- **packages/forge/src/types/index.ts**
  - `EdgeDropMenu` interface (if exported)
- **packages/forge/src/types/ui-constants.ts**
  - Any EdgeDropMenu-related constants/comments

### Commands

- **packages/forge/src/lib/graph-editor/hooks/forge-commands.ts**
  - `FORGE_COMMAND.UI.SET_EDGE_DROP_MENU`
  - Command payload `{ type: 'SET_EDGE_DROP_MENU'; menu: EdgeDropMenuState }`

### Shell / flow editor

- **packages/forge/src/lib/graph-editor/hooks/useSimpleForgeFlowEditor.ts**
  - `edgeDropMenu`, `setEdgeDropMenu` from session store
  - `useEdgeDropBehavior` usage, `onConnectStart` / `onConnectEnd`, `connectingRef: edgeDropConnectingRef`
  - Any `setEdgeDropMenu(null)` or `setEdgeDropMenu(cmd.menu)` in command handlers
  - Returned `edgeDropMenu`, `setEdgeDropMenu` on shell object
- **packages/forge/src/lib/graph-editor/hooks/useForgeFlowEditorShell.ts**
  - Same as above: `edgeDropMenu`, `setEdgeDropMenu`, `useEdgeDropBehavior`, command handling, shell return

### UI components (EdgeDropMenu)

- **packages/forge/src/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/shared/EdgeDropMenu.tsx**
  - Base/generic `EdgeDropMenu` component
- **packages/forge/src/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/CharacterNode/CharacterEdgeDropMenu.tsx**
- **packages/forge/src/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/PlayerNode/PlayerEdgeDropMenu.tsx**
- **packages/forge/src/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/ConditionalNode/ConditionalEdgeDropMenu.tsx**
- **packages/forge/src/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/StoryletNode/StoryletEdgeDropMenu.tsx**
- **packages/forge/src/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/ActNode/ActEdgeDropMenu.tsx**
- **packages/forge/src/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/ChapterNode/ChapterEdgeDropMenu.tsx**
- **packages/forge/src/components/ForgeWorkspace/components/GraphEditors/shared/Nodes/components/PageNode/PageEdgeDropMenu.tsx**

### Graph editor usage

- **packages/forge/src/components/ForgeWorkspace/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx**
  - `storyletEdgeDropMenuByNodeType` map (CharacterEdgeDropMenu, PlayerEdgeDropMenu, etc.)
  - Rendering of `shell.edgeDropMenu` and `MenuComponent` (from storyletEdgeDropMenuByNodeType)
  - Props: screenX, screenY, flowX, flowY, fromNodeId, fromChoiceIdx, fromBlockIdx, sourceHandle, edgeId, onSelect, onClose
- **packages/forge/src/components/ForgeWorkspace/components/GraphEditors/ForgeNarrativeGraphEditor/ForgeNarrativeGraphEditor.tsx**
  - Any analogous edge-drop menu usage (if present)

## Recommended alternative

- **Creating edges:** Use React Flow’s built-in connect behavior (drag from source handle to target handle) and/or a single “Connect” action in the inspector that opens a target picker. Do not implement “drop on canvas opens menu to choose target.”
- **Node palette:** Keep “drag from palette onto canvas to create node”; do not add “drag from handle to open menu” flow.
