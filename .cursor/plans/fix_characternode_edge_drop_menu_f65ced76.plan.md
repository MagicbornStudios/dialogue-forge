---
name: Fix CharacterNode Edge Drop Menu
overview: Fix the edge drop menu not working for CharacterNode in Storylet editor. The handlers are wired but the menu isn't appearing. Need to debug onConnectEnd event handling and ensure the menu renders correctly.
todos: []
---

# Fix CharacterNode Edge Drop Menu

## Root Cause Analysis

After investigation, the edge drop menu infrastructure appears to be in place:

- ✅ `onConnectStart` and `onConnectEnd` are wired to ReactFlow (lines 408-409)
- ✅ Edge drop menu rendering logic exists (lines 532-560)
- ✅ CharacterNode has source handle with `id="next"` (line 191)
- ✅ CharacterEdgeDropMenu component exists and is registered

**Likely Issues:**

1. ReactFlow's `onConnectEnd` may receive `null` event, causing `clientX`/`clientY` to be 0 or undefined
2. The event type might not match expected `MouseEvent | TouchEvent`
3. Mouse position calculation might fail silently
4. Edge drop menu state might not be set correctly

## Implementation Plan

### 1. Fix onConnectEnd Event Handling

**File**: `src/components/GraphEditors/hooks/useForgeFlowEditorShell.ts`

- Update `onConnectEnd` to handle `null` event from ReactFlow
- Add fallback to get mouse position from document-level mouse tracking if event is null
- Add console logging (temporary) to debug event reception
- Ensure `clientX` and `clientY` are always valid numbers before calling `screenToFlowPosition`

### 2. Verify Edge Drop Menu State Management

**File**: `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`

- Verify `shell.edgeDropMenu` state is being set correctly
- Check that the menu component lookup is working (line 539: `storyletEdgeDropMenuByNodeType[sourceNodeType]`)
- Ensure CHARACTER node type is correctly identified

### 3. Debug CharacterNode Handle

**File**: `src/components/GraphEditors/ForgeStoryletGraphEditor/components/CharacterNode/CharacterNode.tsx`

- Verify handle `id="next"` is correct
- Check that handle is not being blocked by other elements (z-index, pointer-events)
- Ensure handle is properly connected to ReactFlow

### 4. Test and Verify

- Test dragging from CharacterNode source handle
- Verify `onConnectStart` is called
- Verify `onConnectEnd` is called with valid event
- Verify `edgeDropMenu` state is set
- Verify menu component renders

## Files to Modify

1. `src/components/GraphEditors/hooks/useForgeFlowEditorShell.ts` - Fix event handling
2. `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx` - Debug/verify menu rendering
3. `src/components/GraphEditors/ForgeStoryletGraphEditor/components/CharacterNode/CharacterNode.tsx` - Verify handle setup (if needed)

## Next Steps (After CharacterNode Works)

Once CharacterNode edge drop menu is working, apply the same fixes to:

- All other node types in Storylet editor
- Narrative editor edge drop menus
- Edge context menus