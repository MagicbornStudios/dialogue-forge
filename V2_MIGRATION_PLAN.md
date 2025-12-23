# Dialogue Editor V2 Migration Plan

## Overview

This document outlines the migration from our custom graph editor (V1) to React Flow-based implementation (V2). We'll maintain V1 components for reference and gradually migrate features.

## Component Structure

### V1 Components (Current - To Be Renamed)
- `DialogueEditor.tsx` → `DialogueEditorV1.tsx`
- `GraphView.tsx` → `GraphViewV1.tsx` (currently placeholder, but main graph logic is in `page.tsx`)

### V2 Components (New - React Flow Based)
- `DialogueEditorV2.tsx` - Main editor component
- `GraphViewV2.tsx` - React Flow graph implementation
- `NPCNodeV2.tsx` - Custom NPC node component
- `PlayerNodeV2.tsx` - Custom Player node component
- `ChoiceEdgeV2.tsx` - Custom edge for choice connections
- `utils/reactflow-converter.ts` - Convert DialogueTree ↔ React Flow format

### Shared Components (No Changes)
- `NodeEditor.tsx` - Can be reused (or create V2 version if needed)
- `YarnView.tsx` - No changes needed
- `PlayView.tsx` - No changes needed
- `FlagManager.tsx` - No changes needed
- `FlagSelector.tsx` - No changes needed
- `GuidePanel.tsx` - No changes needed
- `ExampleLoader.tsx` - No changes needed
- `ZoomControls.tsx` - May be replaced by React Flow Controls

## Feature Inventory & Migration Status

### ✅ Core Graph Features

| Feature | V1 Implementation | V2 Implementation | Status | Notes |
|---------|------------------|-------------------|--------|-------|
| **Node Rendering** | Custom div-based nodes | React Flow custom nodes | 🔄 | Use `NPCNodeV2` and `PlayerNodeV2` |
| **Edge Rendering** | Custom SVG paths | React Flow custom edges | 🔄 | Use `ChoiceEdgeV2` for choice-based edges |
| **Pan** | Manual transform matrix | React Flow built-in | ✅ | Use `panOnDrag` prop |
| **Zoom** | Manual scale transform | React Flow built-in | ✅ | Use `zoomOnScroll`, `zoomOnPinch` |
| **Node Dragging** | Manual mouse tracking | React Flow built-in | ✅ | Use `nodesDraggable` prop |
| **Viewport** | Manual offset/scale state | React Flow viewport | ✅ | Use `useReactFlow()` hook |

### ✅ Interaction Features

| Feature | V1 Implementation | V2 Implementation | Status | Notes |
|---------|------------------|-------------------|--------|-------|
| **Node Selection** | Manual state management | React Flow selection | ✅ | Use `onSelectionChange` |
| **Multi-Select** | Custom selection box | React Flow selection box | ✅ | Use `selectionOnDrag` prop |
| **Context Menu (Graph)** | Custom right-click handler | `onPaneContextMenu` | ✅ | Keep custom menu component |
| **Context Menu (Node)** | Custom right-click handler | `onNodeContextMenu` | ✅ | Keep custom menu component |
| **Edge Creation** | Drag from port, drop on node | React Flow handles + `onConnect` | 🔄 | Need custom handle positioning |
| **Edge Deletion** | Manual edge removal | `onEdgesDelete` | ✅ | Handle in `onEdgesChange` |
| **Node Deletion** | Delete key handler | `onNodesDelete` | ✅ | Handle in `onNodesChange` |

### ✅ Advanced Features

| Feature | V1 Implementation | V2 Implementation | Status | Notes |
|---------|------------------|-------------------|--------|-------|
| **Undo/Redo** | Snapshot-based history | Custom (same approach) | ✅ | Keep existing system, sync with React Flow |
| **Keyboard Shortcuts** | Custom key handlers | React Flow + custom | ✅ | Use `useKeyPress` hook + custom handlers |
| **Zoom Controls** | Custom buttons | React Flow `<Controls>` | ✅ | Use built-in or customize |
| **Zoom to Fit** | Manual calculation | `fitView()` method | ✅ | Use `useReactFlow().fitView()` |
| **Edge Drop Menu** | Custom menu on empty drop | React Flow `onConnectEnd` | 🔄 | May need custom implementation |
| **Node Duplicate** | Context menu action | Custom implementation | ✅ | Keep existing logic |

### ✅ Node-Specific Features

| Feature | V1 Implementation | V2 Implementation | Status | Notes |
|---------|------------------|-------------------|--------|-------|
| **NPC Node** | Single output handle | Custom handle at bottom | ✅ | Use `Handle` component |
| **Player Node** | Multiple choice handles | Dynamic handles per choice | 🔄 | **Critical**: Position handles correctly |
| **Choice Handles** | Positioned at `20 + idx * 24` | Dynamic handle positioning | 🔄 | Use `useUpdateNodeInternals()` when choices change |
| **Flag Indicators** | Visual badges on nodes | Same in custom nodes | ✅ | Keep existing UI |
| **Node Editor Panel** | Sidebar on selection | Same approach | ✅ | Use `onNodeClick` to open |

### ✅ Edge-Specific Features

| Feature | V1 Implementation | V2 Implementation | Status | Notes |
|---------|------------------|-------------------|--------|-------|
| **Choice Edge Colors** | Color array by index | Custom edge with data | ✅ | Store `choiceIndex` in edge data |
| **NPC Edge** | Single gray edge | Default edge type | ✅ | Use default React Flow edge |
| **Edge Curves** | Bezier paths | `getBezierPath()` utility | ✅ | Use React Flow path utilities |
| **Edge Arrows** | SVG markers | React Flow markers | ✅ | Use `markerEnd` prop |

### ✅ Data Management

| Feature | V1 Implementation | V2 Implementation | Status | Notes |
|---------|------------------|-------------------|--------|-------|
| **DialogueTree Format** | Custom structure | Convert to/from React Flow | 🔄 | Create converter utilities |
| **Node Position Sync** | Direct state update | Sync on `onNodesChange` | 🔄 | Update DialogueTree on position changes |
| **Edge Connection Sync** | Direct state update | Sync on `onConnect` | 🔄 | Update DialogueTree on connections |
| **History Integration** | Snapshot before changes | Same approach | ✅ | Save snapshots before React Flow changes |

## Critical Concerns & Solutions

### 🔴 High Priority Concerns

#### 1. **Choice-Based Edge System**
**Concern**: React Flow uses handle-based connections, but we have choice-based edges (one edge per choice).

**Solution**: 
- Create dynamic handles in `PlayerNodeV2` (one per choice)
- Position handles at `20 + idx * 24` from top
- Use `useUpdateNodeInternals()` when choices are added/removed
- Store `choiceIndex` in edge data for `ChoiceEdgeV2` coloring

**Status**: ✅ POC created, needs testing

#### 2. **Edge Drop Menu (Create Node on Drop)**
**Concern**: When dragging edge to empty space, we show a menu to create a new node. React Flow's `onConnectEnd` may not provide this.

**Solution**:
- Use `onConnectEnd` to detect when connection ends without a target
- Show custom menu at drop position
- Create node and connect in one action
- May need to prevent default connection behavior

**Status**: 🔄 Needs implementation

#### 3. **Undo/Redo Integration**
**Concern**: Our snapshot-based undo/redo needs to work with React Flow's change handlers.

**Solution**:
- Save snapshot before React Flow changes
- On undo/redo, convert DialogueTree → React Flow format
- Update React Flow nodes/edges from snapshot
- Use `isUndoRedoRef` to prevent saving during undo/redo

**Status**: ✅ Approach defined, needs implementation

#### 4. **Node Position Updates**
**Concern**: React Flow manages node positions internally. We need to sync back to DialogueTree.

**Solution**:
- Use `onNodesChange` to detect position changes
- Update DialogueTree node positions
- Save to history if position changed
- Handle `position` change type specifically

**Status**: 🔄 Needs implementation

#### 5. **Multi-Select with Keyboard**
**Concern**: Current implementation uses Ctrl+click and selection box. Need to match behavior.

**Solution**:
- Use React Flow's `selectionOnDrag` for box selection
- Use `onNodeClick` with `ctrlKey` check for multi-select
- Sync selected nodes with our state for NodeEditor

**Status**: ✅ React Flow supports this

### 🟡 Medium Priority Concerns

#### 6. **Context Menu Positioning**
**Concern**: React Flow provides context menu events, but we need to position our custom menu.

**Solution**:
- Use `onPaneContextMenu` and `onNodeContextMenu` events
- Get mouse position from event
- Position custom menu component
- Keep existing menu UI

**Status**: ✅ Straightforward

#### 7. **Edge Connection Validation**
**Concern**: We may want to prevent certain connections (e.g., NPC to NPC).

**Solution**:
- Use `isValidConnection` prop
- Check node types and connection rules
- Return `false` for invalid connections

**Status**: ✅ React Flow supports this

#### 8. **Performance with Large Graphs**
**Concern**: Will React Flow handle 100+ nodes well?

**Solution**:
- React Flow has built-in virtualization
- Test with large dialogue trees
- Use `onlyRenderVisibleElements` if needed

**Status**: ✅ React Flow optimized for this

### 🟢 Low Priority Concerns

#### 9. **Styling Consistency**
**Concern**: Match current dark theme and node styling.

**Solution**:
- Customize node components to match current design
- Use same color scheme
- Match edge colors and styles

**Status**: ✅ Straightforward

#### 10. **Zoom Controls UI**
**Concern**: Current zoom controls may not match React Flow's.

**Solution**:
- Use React Flow `<Controls>` component
- Customize styling to match theme
- Or keep custom controls and use `useReactFlow()` methods

**Status**: ✅ Flexible

## Implementation Phases

### Phase 1: Foundation (2-3 days)
- [ ] Install React Flow
- [ ] Create `DialogueEditorV2.tsx` skeleton
- [ ] Create `reactflow-converter.ts` utilities
- [ ] Create basic `NPCNodeV2` and `PlayerNodeV2` components
- [ ] Create `ChoiceEdgeV2` component
- [ ] Test basic rendering

### Phase 2: Core Interactions (2-3 days)
- [ ] Implement node dragging
- [ ] Implement pan/zoom
- [ ] Implement node selection
- [ ] Implement edge connections (NPC → next)
- [ ] Implement choice edge connections
- [ ] Test all interactions

### Phase 3: Advanced Features (2-3 days)
- [ ] Implement context menus
- [ ] Implement edge drop menu
- [ ] Implement multi-select
- [ ] Implement keyboard shortcuts
- [ ] Integrate NodeEditor panel
- [ ] Test edge cases

### Phase 4: Data Sync & History (2-3 days)
- [ ] Sync node positions to DialogueTree
- [ ] Sync edge connections to DialogueTree
- [ ] Integrate undo/redo system
- [ ] Test history with React Flow changes
- [ ] Handle edge cases (delete node, etc.)

### Phase 5: Polish & Testing (1-2 days)
- [ ] Match styling exactly
- [ ] Test all features
- [ ] Performance testing
- [ ] Fix bugs
- [ ] Update documentation

**Total Estimated Time: 9-14 days**

## Testing Checklist

### Basic Functionality
- [ ] Create NPC node (right-click)
- [ ] Create Player node (right-click)
- [ ] Drag nodes
- [ ] Pan graph
- [ ] Zoom in/out
- [ ] Zoom to fit

### Node Interactions
- [ ] Select node (opens NodeEditor)
- [ ] Multi-select nodes (Ctrl+click)
- [ ] Selection box (Ctrl+drag)
- [ ] Delete node (Delete key)
- [ ] Context menu on node

### Edge Interactions
- [ ] Connect NPC to next node
- [ ] Connect Player choice to node
- [ ] Edge colors match choice index
- [ ] Delete edge
- [ ] Edge drop menu (create node on drop)

### Advanced Features
- [ ] Undo/redo works
- [ ] Keyboard shortcuts work
- [ ] Flag indicators show
- [ ] NodeEditor works
- [ ] Yarn export/import works

### Edge Cases
- [ ] Delete node with connections
- [ ] Add/remove choices (handles update)
- [ ] Large graphs (100+ nodes)
- [ ] Rapid undo/redo
- [ ] Context menu positioning

## Migration Strategy

### Option A: Parallel Development (Recommended)
1. Keep V1 components working
2. Build V2 alongside V1
3. Test V2 thoroughly
4. Switch to V2 when ready
5. Keep V1 for reference/rollback

### Option B: Gradual Migration
1. Start with basic graph rendering
2. Add features one by one
3. Test each feature
4. Replace V1 when complete

**Recommendation**: Option A - Parallel development allows testing without breaking existing functionality.

## File Structure

```
packages/dialogue-forge/src/
├── components/
│   ├── DialogueEditorV1.tsx      # Current implementation
│   ├── DialogueEditorV2.tsx      # New React Flow implementation
│   ├── GraphViewV1.tsx           # Current (placeholder)
│   ├── GraphViewV2.tsx            # New React Flow graph
│   ├── NPCNodeV2.tsx              # Custom NPC node
│   ├── PlayerNodeV2.tsx           # Custom Player node
│   ├── ChoiceEdgeV2.tsx           # Custom choice edge
│   ├── NodeEditor.tsx             # Shared (or V2 version)
│   ├── YarnView.tsx               # Shared
│   ├── PlayView.tsx               # Shared
│   └── ... (other shared components)
├── utils/
│   └── reactflow-converter.ts     # DialogueTree ↔ React Flow
└── ...
```

## Next Steps

1. **Rename V1 Components**
   - Rename `DialogueEditor.tsx` → `DialogueEditorV1.tsx`
   - Update imports in `page.tsx`

2. **Install React Flow**
   ```bash
   npm install reactflow
   ```

3. **Create V2 Skeleton**
   - Create `DialogueEditorV2.tsx`
   - Create basic React Flow setup
   - Test with simple dialogue

4. **Implement Core Features**
   - Follow Phase 1-5 plan
   - Test each phase
   - Document issues

5. **Switch to V2**
   - Update `page.tsx` to use V2
   - Test thoroughly
   - Keep V1 for reference

## Success Criteria

- [ ] All V1 features work in V2
- [ ] Performance is equal or better
- [ ] Styling matches V1
- [ ] No regressions in functionality
- [ ] Code is cleaner and more maintainable
- [ ] Documentation updated

## Rollback Plan

If V2 has critical issues:
1. Revert to V1 components
2. Update imports in `page.tsx`
3. Document issues
4. Fix and retry

V1 components remain available for rollback.




