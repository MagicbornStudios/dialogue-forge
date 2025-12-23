# React Flow Migration Plan

## Executive Summary

This document analyzes migrating from the current custom graph editor to React Flow, evaluating pros/cons, migration effort, and recommendations.

## Current Implementation Analysis

### What We Have Now

**Custom Graph Editor** (`app/dialogue-forge/page.tsx`):
- ✅ Custom SVG-based rendering (nodes + edges)
- ✅ Manual pan/zoom with transform matrix
- ✅ Node dragging with position updates
- ✅ Edge dragging (connecting choices to nodes)
- ✅ Context menus (graph + node)
- ✅ Multi-select with selection box (Ctrl+drag)
- ✅ Undo/redo system (snapshot-based)
- ✅ Custom node rendering (NPC/Player types)
- ✅ Custom edge rendering (colored by choice index)
- ✅ Selection box for multi-select
- ✅ Keyboard shortcuts (Delete, Ctrl+A, Ctrl+Z/Y)

**Current Features:**
1. **Graph Interaction**
   - Pan: Middle-click or space+drag
   - Zoom: Mouse wheel, zoom controls
   - Node drag: Click and drag nodes
   - Edge creation: Drag from node/choice to create connection
   - Multi-select: Ctrl+click or drag box
   - Context menu: Right-click graph/node

2. **Node Types**
   - NPC nodes: Speaker + content/conditionals
   - Player nodes: Multiple choices with conditions/flags
   - Visual distinction: Color-coded (red/purple)

3. **Edge System**
   - NPC → next node (single connection)
   - Player → multiple choices (one edge per choice)
   - Color-coded edges per choice index
   - Dragging preview while connecting

4. **Editor Integration**
   - NodeEditor sidebar (opens on node select)
   - Context menu for quick actions
   - Flag system integration
   - Yarn export/import

## React Flow Overview

**React Flow** is a production-ready library for building node-based editors:
- Built-in pan/zoom/viewport management
- Node and edge rendering with customization
- Drag-and-drop support
- Selection system
- Edge connection handling
- Performance optimizations
- Active development and community

### React Flow Features

**Core:**
- ✅ Pan/zoom (built-in, optimized)
- ✅ Node dragging (built-in)
- ✅ Edge connections (handle-based)
- ✅ Selection (single + multi)
- ✅ Viewport controls
- ✅ Minimap (built-in component)
- ✅ Background/Grid (built-in)
- ✅ Keyboard shortcuts (built-in)

**Advanced:**
- ✅ Custom node types
- ✅ Custom edge types
- ✅ Edge routing (auto, smooth, step)
- ✅ Node resizing
- ✅ Node grouping
- ✅ Edge labels
- ✅ Connection validation
- ✅ Performance (virtualization, lazy rendering)

## Comparison: Custom vs React Flow

### ✅ Advantages of React Flow

1. **Less Code to Maintain**
   - ~500+ lines of custom graph logic → ~100-200 lines with React Flow
   - No manual pan/zoom/viewport math
   - No manual edge rendering calculations
   - Built-in performance optimizations

2. **Better Performance**
   - Virtualization for large graphs
   - Optimized rendering
   - Built-in lazy loading
   - Better memory management

3. **More Features Out-of-the-Box**
   - Minimap (we removed ours)
   - Better edge routing
   - Node grouping
   - Edge labels
   - Connection validation
   - Better keyboard shortcuts

4. **Better UX**
   - Smooth animations
   - Better edge routing (avoids nodes)
   - Professional feel
   - Better accessibility

5. **Easier to Extend**
   - Plugin system
   - Well-documented API
   - Active community
   - Regular updates

### ❌ Disadvantages of React Flow

1. **Migration Effort**
   - Need to refactor graph rendering
   - Need to adapt data structures
   - Need to rewrite interaction handlers
   - Learning curve for team

2. **Less Control**
   - Some customization harder
   - May need to work around library limitations
   - Less fine-grained control over rendering

3. **Bundle Size**
   - React Flow adds ~50-100KB (gzipped)
   - Current custom solution: ~0KB (just our code)

4. **Dependency Risk**
   - External dependency
   - Breaking changes possible
   - Less control over updates

5. **Custom Features**
   - Our edge system is unique (choice-based, not handle-based)
   - May need custom edge types
   - Context menu integration needs work

## Migration Complexity Assessment

### High Complexity Areas

1. **Edge System** ✅ **SOLVED WITH CUSTOM EDGES**
   - **Current**: Player nodes have multiple choices, each choice connects to a node
   - **React Flow**: Uses handles (source/target points) on nodes
   - **Solution**: ✅ **Use React Flow custom edges + dynamic handles**
     - **Dynamic Handles**: Add a `<Handle>` component for each choice in the PlayerNode
     - **Custom Edge Type**: Create `ChoiceEdge` component that:
       - Reads `choiceIndex` from edge data
       - Colors edge based on choice index (same color scheme: `['#e94560', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b']`)
       - Uses `getBezierPath` or `getSimpleBezierPath` for smooth curves
     - **Edge Data**: Store `{ choiceIndex: number, choiceId: string }` in edge data
   - **Reference**: [React Flow Custom Edges](https://reactflow.dev/learn/customization/custom-edges)

2. **Node Rendering** ⚠️ **MEDIUM**
   - **Current**: Custom div-based nodes with inline styles
   - **React Flow**: Custom node components (easy)
   - **Challenge**: Need to match current styling/behavior
   - **Solution**: Create custom node components (`NPCNode`, `PlayerNode`)

3. **Context Menu Integration** ⚠️ **MEDIUM**
   - **Current**: Custom context menu on graph/nodes
   - **React Flow**: Has `onPaneContextMenu`, `onNodeContextMenu`
   - **Challenge**: Need to adapt our menu system
   - **Solution**: Use React Flow's context menu events, keep our menu component

4. **Edge Dragging** ⚠️ **MEDIUM**
   - **Current**: Drag from node/choice, drop on target
   - **React Flow**: Uses handles for connections
   - **Challenge**: Need to support dragging from choice index
   - **Solution**: Custom handle rendering per choice, or custom edge creation

5. **Multi-Select** ⚠️ **LOW**
   - **Current**: Ctrl+drag selection box
   - **React Flow**: Built-in selection box
   - **Challenge**: Need to match behavior
   - **Solution**: Use React Flow's selection system

6. **Undo/Redo** ⚠️ **LOW**
   - **Current**: Snapshot-based history
   - **React Flow**: Not affected (works with our data)
   - **Challenge**: None - works the same

### Medium Complexity Areas

1. **Pan/Zoom**
   - React Flow handles this, but need to sync with our state
   - Need to preserve zoom/pan on load

2. **Node Editor Integration**
   - Need to sync React Flow selection with our NodeEditor
   - Use `onNodeClick` to open editor

3. **Flag System Integration**
   - No changes needed - works with our data

### Low Complexity Areas

1. **Yarn Export/Import**
   - No changes - works with DialogueTree structure

2. **Play View**
   - No changes - independent component

3. **Flag Manager**
   - No changes - independent component

## Migration Plan (If We Proceed)

### Phase 1: Setup & Basic Graph (1-2 days)
1. Install React Flow: `npm install reactflow`
2. Create basic React Flow component
3. Convert DialogueTree → React Flow nodes/edges format
4. Render basic graph with custom node types
5. Test with existing dialogue data

### Phase 2: Core Interactions (2-3 days)
1. Implement node dragging
2. Implement pan/zoom
3. Implement node selection
4. Connect to NodeEditor
5. Test all basic interactions

### Phase 3: Edge System (3-4 days) ⚠️ **MOST COMPLEX**
1. Design choice-based edge system
   - Option A: Dynamic handles per choice
   - Option B: Custom edge type
   - Option C: Hybrid approach
2. Implement edge creation (drag from choice)
3. Implement edge rendering (colored by choice)
4. Test edge connections
5. Handle edge deletion

### Phase 4: Advanced Features (2-3 days)
1. Context menu integration
2. Multi-select (selection box)
3. Keyboard shortcuts
4. Minimap (if desired)
5. Edge routing improvements

### Phase 5: Polish & Testing (1-2 days)
1. Match current styling
2. Test all features
3. Performance testing
4. Fix edge cases
5. Update documentation

**Total Estimated Time: 9-14 days**

## Recommendation

### ✅ **RECOMMEND: MIGRATE TO REACT FLOW**

**Reasons:**
1. **Long-term Maintainability**: Less custom code = easier to maintain
2. **Better UX**: Professional feel, better performance
3. **Feature Rich**: Get minimap, better edge routing, etc. for free
4. **Community Support**: Active library, well-documented
5. **Future-Proof**: Easier to add features (grouping, templates, etc.)

**But with Caveats:**
1. **Edge System is Complex**: Our choice-based edges are unique - need careful design
2. **Migration Time**: ~2 weeks of focused work
3. **Testing Required**: Need thorough testing of all interactions

### Alternative: Stay with Custom (If...)

**Stay with custom if:**
- Time is critical (need features now)
- Edge system complexity is too high
- Bundle size is a concern
- You prefer full control

**But consider:**
- More code to maintain long-term
- Harder to add advanced features
- More bugs to fix yourself

## Decision Matrix

| Factor | Custom | React Flow | Winner |
|--------|--------|------------|--------|
| **Development Time** | ✅ Already done | ❌ 2 weeks | Custom |
| **Maintenance** | ❌ High | ✅ Low | React Flow |
| **Performance** | ⚠️ Good | ✅ Excellent | React Flow |
| **Features** | ⚠️ Basic | ✅ Rich | React Flow |
| **Control** | ✅ Full | ⚠️ Some limits | Custom |
| **Bundle Size** | ✅ 0KB | ❌ +50KB | Custom |
| **Future Extensibility** | ❌ Hard | ✅ Easy | React Flow |
| **Edge System Fit** | ✅ Perfect | ⚠️ Needs work | Custom |

## Final Recommendation

**MIGRATE TO REACT FLOW**, but:

1. **Start with a Proof of Concept** (1-2 days)
   - Build basic graph with React Flow
   - Test edge system approach (choice-based handles)
   - Verify it feels right

2. **If POC works, proceed with full migration**
   - Follow migration plan above
   - Focus on edge system first (hardest part)
   - Keep NodeEditor as-is (no changes needed)

3. **If POC shows issues, stay with custom**
   - Improve current implementation
   - Add missing features manually
   - Keep full control

## Next Steps

1. **✅ POC Created** (`src/components/ReactFlowPOC.tsx`)
   - Shows custom ChoiceEdge component
   - Shows dynamic handles on PlayerNode
   - Shows conversion functions
   - Ready to test once React Flow is installed

2. **Install & Test POC**
   ```bash
   npm install reactflow
   ```
   - Uncomment React Flow code in POC
   - Test with existing dialogue tree
   - Verify edge colors and connections work

3. **If POC works, proceed with full migration**

2. **Decision Point**
   - If POC works → Full migration
   - If POC fails → Stay custom, improve current

3. **If Migrating**
   - Follow migration plan
   - Test thoroughly
   - Update documentation

## Questions to Answer Before Migration

1. **Edge System**: Can we make choice-based edges work with React Flow?
   - Test: Dynamic handles per choice
   - Test: Custom edge type
   - Choose best approach

2. **Performance**: Does React Flow perform well with 100+ nodes?
   - Test with large dialogue trees
   - Verify smooth interactions

3. **Styling**: Can we match current dark theme?
   - Test custom node styling
   - Test edge styling
   - Verify context menu styling

4. **Integration**: Does it work with our undo/redo?
   - Test history system
   - Verify state management

## Conclusion

React Flow is a **strong choice** for long-term maintainability and features, but the **edge system is the critical challenge**. A proof-of-concept will determine if migration is feasible.

**Recommendation: Build POC first, then decide.**

