# Yarn Converter Architecture

## Overview

The Yarn Converter uses an extensible handler pattern to convert between `ForgeGraphDoc` and Yarn Spinner format. The architecture is designed for easy extension and clear separation of concerns.

## Core Components

### 1. Handler Pattern

Each node type has a dedicated handler that implements the `NodeHandler` interface:

```typescript
interface NodeHandler {
  canHandle(nodeType: ForgeNodeType): boolean;
  exportNode(node: ForgeReactFlowNode, builder: YarnTextBuilder, context?: YarnConverterContext): Promise<string>;
  importNode(yarnBlock: YarnNodeBlock, context?: YarnConverterContext): Promise<ForgeReactFlowNode>;
}
```

**Benefits:**
- Single Responsibility: Each handler focuses on one node type
- Easy Extension: Add new node types by creating new handlers
- Testability: Each handler can be tested independently

### 2. Registry System

The `NodeHandlerRegistry` maps `ForgeNodeType` to handlers:

```typescript
const registry = new NodeHandlerRegistry();
registry.registerHandler(FORGE_NODE_TYPE.CHARACTER, new CharacterHandler());
registry.registerHandler(FORGE_NODE_TYPE.PLAYER, new PlayerHandler());
// ...
```

**Benefits:**
- Centralized mapping
- Easy to query available handlers
- Supports dynamic handler registration

### 3. Context Object

The `YarnConverterContext` provides:
- Graph resolution (cache-first pattern)
- Visited graph tracking (prevents circular references)
- Workspace store integration

**Cache-First Pattern:**
1. Check cache for graph
2. If not in cache, fetch via adapter
3. Store in cache for future use

### 4. Builder Pattern

Two builders provide transparent Yarn text generation:

- **YarnTextBuilder**: Low-level Yarn syntax building
- **NodeBlockBuilder**: High-level node block construction

**Benefits:**
- Clear, visible text generation
- Easy to update Yarn syntax constants
- Separates formatting from logic

## Export Flow

```
ForgeGraphDoc
    ↓
For each node in graph.flow.nodes:
    ↓
Get handler from registry
    ↓
Handler.exportNode(node, builder, context)
    ↓
NodeBlockBuilder builds Yarn text
    ↓
YarnTextBuilder produces Yarn syntax
    ↓
Concatenate all node blocks
    ↓
Yarn Spinner format string
```

## Import Flow

```
Yarn Spinner format string
    ↓
Parse into YarnNodeBlock[]
    ↓
For each block:
    ↓
Determine node type from content
    ↓
Get handler from registry
    ↓
Handler.importNode(yarnBlock, context)
    ↓
Create ForgeFlowNode
    ↓
Collect all nodes
    ↓
Create ForgeGraphDoc
```

## Extension Points

### Adding a New Node Type

1. **Create Handler Class**
   ```typescript
   export class NewNodeHandler extends BaseNodeHandler {
     canHandle(nodeType: ForgeNodeType): boolean {
       return nodeType === FORGE_NODE_TYPE.NEW_TYPE;
     }
     
     async exportNode(node, builder, context) {
       // Export logic
     }
     
     async importNode(yarnBlock, context) {
       // Import logic
     }
   }
   ```

2. **Register Handler**
   ```typescript
   defaultRegistry.registerHandler(FORGE_NODE_TYPE.NEW_TYPE, new NewNodeHandler());
   ```

3. **Update Type Detection**
   - For import: Update `determineNodeTypeFromYarn()` in `index.ts`
   - For export: Handler is selected by node type

### Extending Existing Handlers

Handlers can be extended by:
- Overriding methods in subclasses
- Composing with utility functions
- Using builder methods for common patterns

## Context Resolution Flow

```
Storylet/Detour Node
    ↓
Check context.visitedGraphs (prevent cycles)
    ↓
Check context.getGraphFromCache()
    ↓
If not in cache:
    ↓
Call context.ensureGraph()
    ↓
Workspace store checks cache
    ↓
If not in cache:
    ↓
Fetch via adapter
    ↓
Store in cache
    ↓
Return graph
```

## Utility Functions

Utilities are organized by responsibility:

- **condition-parser.ts**: Parse Yarn conditions to ForgeCondition[]
- **condition-formatter.ts**: Format ForgeCondition[] to Yarn syntax
- **content-formatter.ts**: Format dialogue content, extract set commands
- **variable-handler.ts**: Format/parse variable operations

**Benefits:**
- Reusable across handlers
- Single source of truth for formatting
- Easy to test independently

## Best Practices

1. **Use Constants**: Always use `FORGE_NODE_TYPE`, `CONDITION_OPERATOR`, etc.
2. **Handle Edge Cases**: Empty content, missing fields, malformed Yarn
3. **Preserve Data**: Round-trip should preserve all data
4. **Clear Text Generation**: Use builders for transparent Yarn syntax
5. **Test Thoroughly**: Export, import, and round-trip tests

## Diagrams

See `diagrams/` directory for visual representations:
- Handler architecture
- Export/import flows
- Context resolution
- Extension points
