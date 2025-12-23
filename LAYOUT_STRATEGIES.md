# Layout Strategies

This document describes the layout strategy system in Dialogue Forge, which uses the **Strategy Pattern** to provide swappable graph layout algorithms.

## Overview

The layout system consists of:

1. **LayoutStrategy Interface** - Defines what a layout algorithm must implement
2. **LayoutRegistry** - Manages available strategies (Singleton pattern)
3. **Built-in Strategies** - Dagre, Force-directed, Grid
4. **Convenience Functions** - Easy-to-use wrapper functions

## Quick Start

```typescript
import { applyLayout, listLayouts } from '@dialogue-forge/layout';

// Apply default layout (dagre)
const result = applyLayout(dialogue);

// Apply with options
const result = applyLayout(dialogue, 'dagre', { direction: 'LR' });

// List available layouts
console.log(listLayouts());
// [
//   { id: 'dagre', name: 'Dagre (Hierarchical)', description: '...', isDefault: true },
//   { id: 'force', name: 'Force-Directed', description: '...' },
//   { id: 'grid', name: 'Grid', description: '...' },
// ]
```

## Built-in Strategies

### Dagre (Default)

Hierarchical layout using the dagre library. Best for dialogue trees with clear start-to-end flow.

```typescript
applyLayout(dialogue, 'dagre', {
  direction: 'TB',  // 'TB' (top-bottom) or 'LR' (left-right)
  nodeSpacingX: 80,
  nodeSpacingY: 120,
  margin: 50,
});
```

**Best for:**
- Linear dialogue with branches
- Quest dialogues with clear progression
- Tutorials and guided conversations

### Force-Directed

Physics-based layout that spreads nodes evenly. Uses repulsion (nodes push apart) and attraction (connected nodes pull together).

```typescript
applyLayout(dialogue, 'force', {
  nodeSpacingX: 300,
  nodeSpacingY: 200,
  margin: 50,
});
```

**Best for:**
- Complex interconnected dialogues
- Exploring graph structure
- Finding node clusters

### Grid

Simple grid-based layout that arranges nodes in rows and columns.

```typescript
applyLayout(dialogue, 'grid', {
  nodeSpacingX: 50,
  nodeSpacingY: 50,
  margin: 50,
});
```

**Best for:**
- Quick overview of all nodes
- Very large dialogues
- Debugging/inspection

## Creating Custom Strategies

### Step 1: Implement the Interface

Create a new file in `src/utils/layout/strategies/`:

```typescript
// src/utils/layout/strategies/my-custom.ts

import { DialogueTree } from '../../../types';
import { LayoutStrategy, LayoutOptions, LayoutResult } from '../types';

export class MyCustomLayoutStrategy implements LayoutStrategy {
  // Required: Unique identifier
  readonly id = 'my-custom';
  
  // Required: Human-readable name
  readonly name = 'My Custom Layout';
  
  // Required: Description
  readonly description = 'A custom layout algorithm that does amazing things.';
  
  // Optional: Default options
  readonly defaultOptions: Partial<LayoutOptions> = {
    direction: 'TB',
    margin: 50,
  };

  // Required: Main layout function
  apply(dialogue: DialogueTree, options?: LayoutOptions): LayoutResult {
    const startTime = performance.now();
    const opts = { ...this.defaultOptions, ...options };
    
    // Your layout algorithm here
    const updatedNodes: Record<string, DialogueNode> = {};
    
    for (const [id, node] of Object.entries(dialogue.nodes)) {
      // Calculate new position
      const x = /* your logic */;
      const y = /* your logic */;
      
      updatedNodes[id] = { ...node, x, y };
    }
    
    // Calculate bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const node of Object.values(updatedNodes)) {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x + 220); // NODE_WIDTH
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y + 120); // NODE_HEIGHT
    }
    
    return {
      dialogue: { ...dialogue, nodes: updatedNodes },
      metadata: {
        computeTimeMs: performance.now() - startTime,
        nodeCount: Object.keys(dialogue.nodes).length,
        bounds: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY },
      },
    };
  }

  // Optional: Check if this strategy supports the dialogue
  supports(dialogue: DialogueTree): boolean {
    // Return false if your algorithm has requirements
    return true;
  }
}
```

### Step 2: Export from strategies/index.ts

```typescript
// src/utils/layout/strategies/index.ts

export { DagreLayoutStrategy } from './dagre';
export { ForceLayoutStrategy } from './force';
export { GridLayoutStrategy } from './grid';
export { MyCustomLayoutStrategy } from './my-custom';  // Add this
```

### Step 3: Register in layout/index.ts

```typescript
// src/utils/layout/index.ts

import { MyCustomLayoutStrategy } from './strategies';

// Register strategies
layoutRegistry.register(new DagreLayoutStrategy(), true);
layoutRegistry.register(new ForceLayoutStrategy());
layoutRegistry.register(new GridLayoutStrategy());
layoutRegistry.register(new MyCustomLayoutStrategy());  // Add this
```

### Step 4: Use Your Strategy

```typescript
const result = applyLayout(dialogue, 'my-custom');
```

## Advanced: Runtime Registration

You can also register strategies at runtime without modifying the source:

```typescript
import { layoutRegistry, LayoutStrategy } from '@dialogue-forge/layout';

// Create and register
const myStrategy: LayoutStrategy = {
  id: 'runtime-custom',
  name: 'Runtime Custom',
  description: 'Registered at runtime',
  apply(dialogue, options) {
    // ...
  },
};

layoutRegistry.register(myStrategy);

// Now usable
const result = layoutRegistry.apply('runtime-custom', dialogue);
```

## API Reference

### LayoutStrategy Interface

```typescript
interface LayoutStrategy {
  readonly id: string;                              // Unique identifier
  readonly name: string;                            // Display name
  readonly description: string;                     // Description
  readonly defaultOptions?: Partial<LayoutOptions>; // Default config
  
  apply(dialogue: DialogueTree, options?: LayoutOptions): LayoutResult;
  supports?(dialogue: DialogueTree): boolean;       // Optional validation
}
```

### LayoutOptions

```typescript
interface LayoutOptions {
  direction?: 'TB' | 'LR';    // Layout flow direction
  nodeSpacingX?: number;      // Horizontal spacing
  nodeSpacingY?: number;      // Vertical spacing
  margin?: number;            // Outer margin
  animate?: boolean;          // Enable animation
}
```

### LayoutResult

```typescript
interface LayoutResult {
  dialogue: DialogueTree;     // Updated dialogue with new positions
  metadata: {
    computeTimeMs: number;    // Time to compute
    nodeCount: number;        // Nodes processed
    bounds: {                 // Bounding box
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
      width: number;
      height: number;
    };
  };
}
```

### Registry Methods

```typescript
layoutRegistry.register(strategy, isDefault?)  // Add a strategy
layoutRegistry.unregister(id)                  // Remove a strategy
layoutRegistry.get(id)                         // Get strategy by ID
layoutRegistry.getDefault()                    // Get default strategy
layoutRegistry.setDefault(id)                  // Set default strategy
layoutRegistry.list()                          // List all strategies
layoutRegistry.apply(id, dialogue, options?)   // Apply a strategy
layoutRegistry.has(id)                         // Check if registered
layoutRegistry.size                            // Number of strategies
layoutRegistry.clear()                         // Remove all strategies
```

## Design Patterns Used

### Strategy Pattern

The core of this system. Each layout algorithm is encapsulated in its own class implementing `LayoutStrategy`. This allows:

- **Runtime switching** - Change algorithms without code changes
- **Easy testing** - Test each algorithm in isolation
- **Open/Closed Principle** - Add new layouts without modifying existing code

### Registry/Singleton Pattern

`layoutRegistry` is a singleton that manages all available strategies. Benefits:

- **Central access point** - One place to find all layouts
- **Consistent state** - Same registry across the application
- **Easy enumeration** - List available strategies for UI

### Factory Pattern (via Registry)

The registry acts as a factory, creating/providing strategies by ID:

```typescript
const strategy = layoutRegistry.get('dagre');  // Get by ID
const result = layoutRegistry.apply('dagre', dialogue);  // Apply by ID
```

## File Structure

```
src/utils/layout/
├── index.ts           # Main exports and setup
├── types.ts           # TypeScript interfaces
├── registry.ts        # LayoutRegistry singleton
├── collision.ts       # Node collision resolution
└── strategies/
    ├── index.ts       # Strategy exports
    ├── dagre.ts       # Dagre (hierarchical)
    ├── force.ts       # Force-directed
    └── grid.ts        # Grid layout
```



