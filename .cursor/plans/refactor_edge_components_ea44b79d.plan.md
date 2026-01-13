---
name: Refactor Edge Components
overview: Consolidate reusable SVG elements into shared components, replace hardcoded colors with centralized edge styling utilities, and fix source node access to work with ForgeGraphDoc structure.
todos:
  - id: "1"
    content: Create shared SVG components file (EdgeSVGElements.tsx) with EdgePulseAnimation, LoopIndicator, and LoopArrowMarker
    status: completed
  - id: "2"
    content: Update forge-edge-styles.ts to export TYPE_COLORS and ensure edgeColorFor works with ForgeFlowNode
    status: completed
  - id: "3"
    content: Update NPCEdgeV2.tsx to use shared components and edgeColorFor(), remove EDGE_COLORS_BY_SOURCE_TYPE
    status: completed
    dependencies:
      - "1"
      - "2"
  - id: "4"
    content: Update ChoiceEdgeV2.tsx to use shared components and edgeColorFor() instead of CSS variables
    status: completed
    dependencies:
      - "1"
      - "2"
  - id: "5"
    content: Fix ForgeStoryletGraphEditor.tsx to pass source ForgeFlowNode in edge data and fix graph.nodes references
    status: in_progress
    dependencies:
      - "2"
  - id: "6"
    content: Verify all edge components work correctly and scan for any other edge files needing updates
    status: pending
    dependencies:
      - "3"
      - "4"
      - "5"
---

# Refactor Edge Components for Reusability and Consistency

## Overview

Refactor edge components to:

1. Extract reusable SVG elements (pulse animation, loop markers, loop indicators) into shared components
2. Replace hardcoded color definitions with centralized `edgeColorFor()` from `forge-edge-styles.ts`
3. Fix source node access to work with `ForgeGraphDoc` structure (`graph.flow.nodes` instead of `graph.nodes`)

## Changes

### 1. Create Shared SVG Components

**File**: `src/components/GraphEditors/shared/EdgeSVGElements.tsx`

- Create `EdgePulseAnimation` component for the animated circle that follows the edge path
- Create `LoopIndicator` component for the circular icon with ↺ symbol
- Create `LoopArrowMarker` component for the custom arrow marker used on back edges
- These components accept props for color, path, position, and visibility

### 2. Update `forge-edge-styles.ts`

**File**: `src/components/GraphEditors/utils/forge-edge-styles.ts`

- Export `TYPE_COLORS` so edge components can access it directly if needed
- Ensure `edgeColorFor()` works correctly with `ForgeFlowEdge` and `ForgeFlowNode` types
- Add helper function to get source node from edge ID if needed

### 3. Update `NPCEdgeV2.tsx`

**File**: `src/components/GraphEditors/ForgeStoryletGraphEditor/components/NPCNode/NPCEdgeV2.tsx`

- Remove `EDGE_COLORS_BY_SOURCE_TYPE` constant (lines 13-18)
- Replace custom color logic with `edgeColorFor()` from `forge-edge-styles.ts`
- Replace inline SVG elements (lines 137-143, 147-166, 129-134) with shared components
- Update to get source node from `edge.data.sourceNode` (passed from parent) or look it up from graph
- Use `ForgeFlowNode` type for source node

### 4. Update `ChoiceEdgeV2.tsx`

**File**: `src/components/GraphEditors/ForgeStoryletGraphEditor/components/PlayerNode/ChoiceEdgeV2.tsx`

- Replace CSS variable-based choice colors with `edgeColorFor()` using `CHOICE_COLORS` from `forge-edge-styles.ts`
- Replace inline SVG elements (lines 123-129, 115-119, 132-151) with shared components
- Update to use `edgeColorFor()` for consistent color handling

### 5. Update `ForgeStoryletGraphEditor.tsx`

**File**: `src/components/GraphEditors/ForgeStoryletGraphEditor/ForgeStoryletGraphEditor.tsx`

- Fix line 1022: Change `effectiveGraph.nodes[edge.source] `to look up from `graph.flow.nodes`
- Pass source `ForgeFlowNode` in edge data so edge components can use `edgeColorFor()`
- Update all other references to `effectiveGraph.nodes` to use `graph.flow.nodes` structure
- Ensure edges receive the source node as `ForgeFlowNode` type in their data

### 6. Verify Other Edge Components

- Check if any other edge components (ConditionalNode edges, etc.) need similar updates
- Ensure all edge components work with the new `ForgeGraphDoc` structure

## Implementation Details

### Edge Color Resolution

- `edgeColorFor(edge, sourceNode)` will determine color based on:
  - Edge `sourceHandle` (choice-X, block-X) → uses `CHOICE_COLORS`
  - Source node type → uses `TYPE_COLORS`
  - Fallback → gray (#9ca3af)

### Source Node Access Pattern

```typescript
// In ForgeStoryletGraphEditor.tsx when mapping edges:
const sourceFlowNode = graph.flow.nodes.find(n => n.id === edge.source);
// Pass to edge data:
data: {
  ...edge.data,
  sourceNode: sourceFlowNode, // ForgeFlowNode
}
```

### Shared SVG Components API

```typescript
<EdgePulseAnimation 
  path={edgePath} 
  color={pulseColor} 
  visible={shouldAnimate} 
/>
<LoopIndicator 
  x={labelX} 
  y={labelY} 
  color={strokeColor} 
  visible={isBackEdge} 
/>
<LoopArrowMarker 
  id={`loop-arrow-${edgeId}`} 
  color={loopColor} 
  visible={isBackEdge} 
/>
```

## Testing

- Verify edges display correct colors based on source node type
- Verify choice edges use correct colors from `CHOICE_COLORS` array
- Verify pulse animation works on edges in path
- Verify loop indicators and markers display correctly
- Verify all edge types work with `ForgeGraphDoc` structure