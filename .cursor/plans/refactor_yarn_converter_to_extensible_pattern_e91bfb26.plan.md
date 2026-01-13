---
name: Refactor Yarn Converter to Extensible Pattern
overview: Refactor the monolithic yarn-converter.ts into an extensible, maintainable architecture using the Strategy pattern. Split into multiple files with clear separation of concerns, add Yarn Spinner documentation, and support for storylet/detour nodes that fetch referenced graphs via adapter/cache.
todos:
  - id: extract-types-context
    content: Create types.ts and context.ts with YarnConverterContext and NodeHandler interfaces
    status: pending
  - id: extract-utilities
    content: Extract condition formatting/parsing, content formatting, and variable handling into utils/
    status: pending
  - id: create-base-handler
    content: Create base-handler.ts with abstract BaseNodeHandler class
    status: pending
    dependencies:
      - extract-types-context
  - id: create-registry
    content: Create registry.ts with NodeHandlerRegistry for mapping node types to handlers
    status: pending
    dependencies:
      - create-base-handler
  - id: implement-character-handler
    content: Implement character-handler.ts for CHARACTER nodes
    status: pending
    dependencies:
      - create-base-handler
      - extract-utilities
  - id: implement-player-handler
    content: Implement player-handler.ts for PLAYER nodes
    status: pending
    dependencies:
      - create-base-handler
      - extract-utilities
  - id: implement-conditional-handler
    content: Implement conditional-handler.ts for CONDITIONAL nodes
    status: pending
    dependencies:
      - create-base-handler
      - extract-utilities
  - id: implement-storylet-handler
    content: Implement storylet-handler.ts with graph fetching and inlining logic
    status: pending
    dependencies:
      - create-base-handler
      - extract-utilities
      - create-registry
  - id: implement-detour-handler
    content: Implement detour-handler.ts with graph fetching and return handling
    status: pending
    dependencies:
      - create-base-handler
      - extract-utilities
      - create-registry
  - id: create-main-converter
    content: Create index.ts with async exportToYarn and importFromYarn using registry
    status: pending
    dependencies:
      - create-registry
      - implement-character-handler
      - implement-player-handler
      - implement-conditional-handler
      - implement-storylet-handler
      - implement-detour-handler
  - id: add-documentation
    content: Add Yarn Spinner documentation files in docs/ folder and JSDoc references
    status: pending
  - id: update-imports
    content: Update all imports from old yarn-converter.ts to new structure
    status: pending
    dependencies:
      - create-main-converter
  - id: remove-old-file
    content: Remove old yarn-converter.ts file after migration complete
    status: pending
    dependencies:
      - update-imports
---

# Refactor Yarn Converter to Extensible Pattern

## Overview

Refactor `src/lib/yarn-converter.ts` into a modular, extensible architecture using the Strategy pattern. Each node type will have its own handler, making it easy to add new node types and Yarn Spinner features. The converter will support storylet/detour nodes that inline referenced graphs fetched via the adapter/cache.

## Architecture

### Design Pattern: Strategy + Registry

- **Strategy Pattern**: Each node type has a dedicated exporter/importer handler
- **Registry Pattern**: Central registry maps `ForgeNodeType` to handlers
- **Context Object**: Provides adapter/cache access for fetching referenced graphs
- **Separation of Concerns**: Utilities split by responsibility (conditions, content, variables)

### File Structure

```
src/lib/yarn-converter/
├── index.ts                    # Main export/import functions
├── types.ts                    # Types, interfaces, context
├── context.ts                  # Context for adapter/cache access
├── registry.ts                 # Node handler registry
├── handlers/
│   ├── base-handler.ts         # Base interface/abstract class
│   ├── character-handler.ts    # CHARACTER node handler
│   ├── player-handler.ts       # PLAYER node handler
│   ├── conditional-handler.ts  # CONDITIONAL node handler
│   ├── storylet-handler.ts     # STORYLET node handler (with graph fetching)
│   └── detour-handler.ts       # DETOUR node handler (with graph fetching)
├── utils/
│   ├── condition-formatter.ts # Format conditions to Yarn syntax
│   ├── condition-parser.ts     # Parse Yarn conditions to ForgeCondition[]
│   ├── content-formatter.ts    # Format content (speaker, text, etc.)
│   └── variable-handler.ts     # Handle <<set>> commands and flags
└── docs/
    ├── scripting-fundamentals.md
    ├── nodes-and-lines.md
    ├── options.md
    ├── jump-command.md
    ├── detour-command.md
    ├── variables.md
    ├── flow-control.md
    ├── commands.md
    └── functions.md
```

## Implementation Plan

### Phase 1: Extract Types and Context

**File**: `src/lib/yarn-converter/types.ts`

- Define `YarnConverterContext` interface with:
  - `adapter?: ForgeDataAdapter` - for fetching referenced graphs
  - `graphCache?: Map<string, ForgeGraphDoc>` - cache for already-fetched graphs
  - `visitedGraphs?: Set<number>` - prevent circular references
- Define `NodeHandler` interface:
  ```typescript
  interface NodeHandler {
    canHandle(nodeType: ForgeNodeType): boolean;
    exportNode(node: ForgeFlowNode, context: YarnConverterContext): Promise<string>;
    importNode(yarnNode: YarnNodeBlock, context: YarnConverterContext): Promise<ForgeFlowNode>;
  }
  ```

- Define `YarnNodeBlock` type for parsed Yarn node structure

**File**: `src/lib/yarn-converter/context.ts`

- Create `YarnConverterContext` class that:
  - Manages adapter/cache access
  - Tracks visited graphs to prevent cycles
  - Provides `fetchGraph(graphId: number): Promise<ForgeGraphDoc>` method
  - Implements cache-first lookup pattern

### Phase 2: Extract Utilities

**File**: `src/lib/yarn-converter/utils/condition-formatter.ts`

- Extract condition formatting logic from current converter
- Function: `formatCondition(cond: ForgeCondition): string`
- Function: `formatConditions(conds: ForgeCondition[]): string` (joins with AND)

**File**: `src/lib/yarn-converter/utils/condition-parser.ts`

- Extract condition parsing logic from `importFromYarn`
- Function: `parseCondition(conditionStr: string): ForgeCondition[]`
- Handle all operators (IS_SET, EQUALS, GREATER_THAN, etc.)

**File**: `src/lib/yarn-converter/utils/content-formatter.ts`

- Extract content formatting (speaker, text, multiline)
- Function: `formatContent(content: string, speaker?: string): string`
- Function: `extractSetCommands(content: string): string[]` - extract <<set>> commands

**File**: `src/lib/yarn-converter/utils/variable-handler.ts`

- Extract variable/flag handling logic
- Function: `formatSetCommand(flag: string, value?: any): string`
- Function: `parseSetCommand(cmd: string): { flag: string; operator: string; value: any }`

### Phase 3: Create Base Handler and Registry

**File**: `src/lib/yarn-converter/handlers/base-handler.ts`

- Define abstract `BaseNodeHandler` class implementing `NodeHandler`
- Provide common utilities (formatting, parsing)
- Abstract methods: `exportNode`, `importNode`

**File**: `src/lib/yarn-converter/registry.ts`

- Create `NodeHandlerRegistry` class
- Register handlers for each node type
- Method: `getHandler(nodeType: ForgeNodeType): NodeHandler`
- Method: `registerHandler(nodeType: ForgeNodeType, handler: NodeHandler): void`

### Phase 4: Implement Node Handlers

**File**: `src/lib/yarn-converter/handlers/character-handler.ts`

- Extend `BaseNodeHandler`
- Handle CHARACTER nodes (current CHARACTER logic from converter)
- Export: content, speaker, conditional blocks, flags, nextNodeId
- Import: parse dialogue content, extract speaker, handle conditionals

**File**: `src/lib/yarn-converter/handlers/player-handler.ts`

- Extend `BaseNodeHandler`
- Handle PLAYER nodes (current PLAYER logic)
- Export: choices with conditions, flags, nextNodeId
- Import: parse -> choices, handle conditional choices

**File**: `src/lib/yarn-converter/handlers/conditional-handler.ts`

- Extend `BaseNodeHandler`
- Handle CONDITIONAL nodes (current CONDITIONAL logic)
- Export: conditional blocks (if/elseif/else)
- Import: parse conditional blocks

**File**: `src/lib/yarn-converter/handlers/storylet-handler.ts`

- Extend `BaseNodeHandler`
- Handle STORYLET nodes with `storyletCall`
- Export:

  1. Fetch referenced graph via context.adapter
  2. Recursively export referenced graph's nodes (with context to prevent cycles)
  3. Inline nodes into current Yarn file
  4. Create jump from storylet node to referenced graph's start node

- Import: Handle storylet references (may need custom Yarn syntax or metadata)

**File**: `src/lib/yarn-converter/handlers/detour-handler.ts`

- Extend `BaseNodeHandler`
- Similar to storylet-handler but for DETOUR nodes
- Handle `storyletCall` with `DETOUR_RETURN` mode
- Export: Inline referenced graph, handle return node

### Phase 5: Create Main Converter Functions

**File**: `src/lib/yarn-converter/index.ts`

- Re-export `exportToYarn` and `importFromYarn`
- `exportToYarn(graph: ForgeGraphDoc, context?: YarnConverterContext): Promise<string>`
  - Create context if not provided
  - Iterate through graph.flow.nodes
  - Get handler from registry
  - Call handler.exportNode for each node
  - Combine results with `===` separators
- `importFromYarn(yarnContent: string, title?: string, context?: YarnConverterContext): Promise<ForgeGraphDoc>`
  - Parse Yarn content into node blocks
  - Get handler from registry (determine type from content)
  - Call handler.importNode for each block
  - Build ForgeGraphDoc from results

### Phase 6: Add Yarn Spinner Documentation

**File**: `src/lib/yarn-converter/docs/scripting-fundamentals.md`

- Scrape/copy content from https://docs.yarnspinner.dev/write-yarn-scripts/scripting-fundamentals
- Document: nodes, lines, options, jump, detour, variables, flow control, commands, functions

**Files**: Individual docs for each topic (nodes-and-lines.md, options.md, etc.)

- Reference in JSDoc comments throughout code
- Link to docs in handler implementations

### Phase 7: Update Imports and Tests

**File**: `src/lib/yarn-converter.ts` (deprecated, redirect to new location)

- Re-export from `src/lib/yarn-converter/index.ts` for backward compatibility

**Update**: Any files importing from `src/lib/yarn-converter.ts`

- Update imports to use new structure
- Update function calls to pass context when needed

## Key Design Decisions

1. **Async Export**: Export becomes async to support fetching referenced graphs
2. **Context Pattern**: Context object provides adapter/cache access without tight coupling
3. **Inline Strategy**: Storylet/detour nodes inline referenced graphs (flatten structure)
4. **Cycle Prevention**: Context tracks visited graphs to prevent infinite recursion
5. **Extensibility**: New node types just need to implement `NodeHandler` and register

## Migration Strategy

1. Create new structure alongside existing file
2. Implement handlers one by one, testing each
3. Update main functions to use registry
4. Add documentation
5. Update imports
6. Remove old file

## Benefits

- **Extensibility**: Add new node types by creating a handler and registering it
- **Maintainability**: Each node type's logic is isolated
- **Testability**: Handlers can be tested independently
- **Documentation**: Yarn Spinner features are documented locally
- **Type Safety**: Strong typing throughout
- *