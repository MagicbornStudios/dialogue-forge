---
name: Refactor Yarn Converter to Extensible Pattern
overview: Refactor the monolithic yarn-converter.ts into an extensible, maintainable architecture using the Strategy pattern. Integrate with existing workspace store for graph resolution, make Yarn text generation transparent with clear formatting functions, and support storylet/detour nodes that fetch referenced graphs via the workspace store's cache-first resolver.
todos:
  - id: create-types-workspace
    content: Create types.ts and workspace-context.ts integrating with ForgeWorkspaceStore pattern
    status: pending
  - id: create-text-builders
    content: Create yarn-text-builder.ts and node-block-builder.ts with transparent formatting and clear Yarn syntax constants
    status: pending
  - id: extract-utilities
    content: Extract condition formatting/parsing, content formatting, and variable handling into utils/ with clear formatting
    status: pending
  - id: create-base-handler
    content: Create base-handler.ts with abstract BaseNodeHandler class
    status: pending
    dependencies:
      - create-types-workspace
      - create-text-builders
  - id: create-registry
    content: Create registry.ts with NodeHandlerRegistry
    status: pending
    dependencies:
      - create-base-handler
  - id: implement-character-handler
    content: Implement character-handler.ts using YarnTextBuilder for transparent text generation
    status: pending
    dependencies:
      - create-base-handler
      - extract-utilities
  - id: implement-player-handler
    content: Implement player-handler.ts using YarnTextBuilder
    status: pending
    dependencies:
      - create-base-handler
      - extract-utilities
  - id: implement-conditional-handler
    content: Implement conditional-handler.ts using YarnTextBuilder
    status: pending
    dependencies:
      - create-base-handler
      - extract-utilities
  - id: implement-storylet-handler
    content: Implement storylet-handler.ts using workspace context for cache-first graph resolution and inlining
    status: pending
    dependencies:
      - create-base-handler
      - extract-utilities
      - create-registry
      - create-types-workspace
  - id: implement-detour-handler
    content: Implement detour-handler.ts with return node handling
    status: pending
    dependencies:
      - create-base-handler
      - extract-utilities
      - create-registry
      - create-types-workspace
  - id: create-main-converter
    content: Create index.ts with async exportToYarn and importFromYarn using registry and builders
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
    content: Update all imports from old yarn-converter.ts to new structure, handle async API
    status: pending
    dependencies:
      - create-main-converter
  - id: remove-old-file
    content: Remove old yarn-converter.ts after migration complete
    status: pending
    dependencies:
      - update-imports
---

# Refactor Yarn Converter to Extensible Pattern

## Overview

Refactor `src/lib/yarn-converter.ts` into a modular, extensible architecture using the Strategy pattern. Each node type will have its own handler, making it easy to add new node types and Yarn Spinner features. The converter will integrate with the existing workspace store pattern for graph resolution and provide transparent Yarn text generation with clear formatting functions.

## Architecture

### Design Pattern: Strategy + Registry + Builder

- **Strategy Pattern**: Each node type has a dedicated exporter/importer handler
- **Registry Pattern**: Central registry maps `ForgeNodeType` to handlers
- **Workspace Store Integration**: Use existing `ForgeWorkspaceStore` for graph resolution (cache-first pattern)
- **Text Builder Pattern**: Transparent Yarn text generation with clear formatting functions
- **Separation of Concerns**: Utilities split by responsibility (conditions, content, variables, formatting)

### File Structure

```
src/lib/yarn-converter/
├── index.ts                    # Main export/import functions
├── types.ts                    # Types, interfaces
├── workspace-context.ts        # Integration with ForgeWorkspaceStore
├── registry.ts                 # Node handler registry
├── builders/
│   ├── yarn-text-builder.ts   # Transparent Yarn text building with clear formatting
│   └── node-block-builder.ts  # Building individual node blocks
├── handlers/
│   ├── base-handler.ts         # Base interface/abstract class
│   ├── character-handler.ts    # CHARACTER node handler
│   ├── player-handler.ts       # PLAYER node handler
│   ├── conditional-handler.ts  # CONDITIONAL node handler
│   ├── storylet-handler.ts     # STORYLET node handler (with graph fetching)
│   └── detour-handler.ts       # DETOUR node handler (with graph fetching)
├── utils/
│   ├── condition-formatter.ts  # Format conditions to Yarn syntax (transparent)
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

## Key Design Decisions

### 1. Workspace Store Integration

Instead of creating a new context pattern, integrate with existing `ForgeWorkspaceStore`:

- **File**: `src/lib/yarn-converter/workspace-context.ts`
- Accept `ForgeWorkspaceStore` instance (or store state + actions)
- Use existing `graphs.byId` cache and `ensureGraph` action
- Leverage existing cache-first resolver pattern from `createGraphResolver`
- No duplication of graph resolution logic

### 2. Transparent Yarn Text Generation

**File**: `src/lib/yarn-converter/builders/yarn-text-builder.ts`

Create a builder that makes Yarn text generation transparent:

```typescript
class YarnTextBuilder {
  // Clear, visible formatting functions
  addNodeTitle(nodeId: string): this
  addNodeSeparator(): this
  addLine(content: string, speaker?: string): this
  addOption(choiceText: string, indent?: number): this
  addCommand(command: string, args?: string): this
  addConditionalBlock(type: 'if' | 'elseif' | 'else', condition?: string): this
  addEndConditional(): this
  addJump(targetNodeId: string, indent?: number): this
  addSetCommand(flag: string, value?: any, indent?: number): this
  
  // Get final result
  build(): string
}
```

Benefits:

- Clear visibility of how each Yarn construct is produced
- Easy to update string prefixes/formatting in one place
- Can see exact Yarn syntax being generated
- Easy to add new Yarn features

### 3. Node Block Builder

**File**: `src/lib/yarn-converter/builders/node-block-builder.ts`

Helper for building complete node blocks:

```typescript
class NodeBlockBuilder {
  constructor(private nodeId: string, private textBuilder: YarnTextBuilder)
  
  startNode(): this
  addContent(content: string, speaker?: string): this
  addConditionalBlocks(blocks: ForgeConditionalBlock[]): this
  addChoices(choices: ForgeChoice[]): this
  addFlags(flags: string[]): this
  addNextNode(nextNodeId: string): this
  endNode(): string  // Returns complete node block
}
```

## Implementation Plan

### Phase 1: Create Types and Workspace Integration

**File**: `src/lib/yarn-converter/types.ts`

- Define `YarnConverterContext` interface:
  ```typescript
  interface YarnConverterContext {
    workspaceStore?: ForgeWorkspaceStore;
    // Or if we want to be more explicit:
    getGraphFromCache?: (graphId: string) => ForgeGraphDoc | undefined;
    ensureGraph?: (graphId: string) => Promise<ForgeGraphDoc>;
    visitedGraphs?: Set<number>; // Prevent circular references
  }
  ```

- Define `NodeHandler` interface
- Define `YarnNodeBlock` type for parsed Yarn structure

**File**: `src/lib/yarn-converter/workspace-context.ts`

- Create helper to extract graph resolution from workspace store:
  ```typescript
  export function createWorkspaceContext(
    store: ForgeWorkspaceStore
  ): YarnConverterContext {
    return {
      getGraphFromCache: (graphId: string) => {
        const state = store.getState();
        return state.graphs.byId[graphId];
      },
      ensureGraph: async (graphId: string) => {
        const state = store.getState();
        await state.actions.ensureGraph(graphId, 'storylet');
        return store.getState().graphs.byId[graphId];
      },
      visitedGraphs: new Set(),
    };
  }
  ```


### Phase 2: Create Transparent Text Builders

**File**: `src/lib/yarn-converter/builders/yarn-text-builder.ts`

- Implement `YarnTextBuilder` class with clear formatting methods
- All Yarn syntax constants visible at top of file:
  ```typescript
  const YARN_SYNTAX = {
    NODE_TITLE_PREFIX: 'title: ',
    NODE_SEPARATOR: '---',
    NODE_END: '===',
    OPTION_PREFIX: '-> ',
    JUMP_COMMAND: '<<jump ',
    SET_COMMAND: '<<set ',
    IF_COMMAND: '<<if ',
    ELSEIF_COMMAND: '<<elseif ',
    ELSE_COMMAND: '<<else>>',
    ENDIF_COMMAND: '<<endif>>',
    // ... etc
  } as const;
  ```

- Each method clearly shows what Yarn text it produces
- Easy to update formatting in one place

**File**: `src/lib/yarn-converter/builders/node-block-builder.ts`

- Implement `NodeBlockBuilder` that uses `YarnTextBuilder`
- Provides higher-level API for building complete nodes

### Phase 3: Extract Utilities with Clear Formatting

**File**: `src/lib/yarn-converter/utils/condition-formatter.ts`

- `formatCondition(cond: ForgeCondition): string` - clear, visible formatting
- `formatConditions(conds: ForgeCondition[]): string` - joins with AND
- All condition operators clearly mapped to Yarn syntax

**File**: `src/lib/yarn-converter/utils/condition-parser.ts`

- `parseCondition(conditionStr: string): ForgeCondition[]`
- Clear regex patterns and parsing logic

**File**: `src/lib/yarn-converter/utils/content-formatter.ts`

- `formatContent(content: string, speaker?: string): string`
- `extractSetCommands(content: string): string[]`
- Clear speaker prefix formatting

**File**: `src/lib/yarn-converter/utils/variable-handler.ts`

- `formatSetCommand(flag: string, value?: any): string`
- `parseSetCommand(cmd: string): { flag: string; operator: string; value: any }`
- Clear variable syntax formatting

### Phase 4: Create Base Handler and Registry

**File**: `src/lib/yarn-converter/handlers/base-handler.ts`

- Abstract `BaseNodeHandler` class
- Provides access to `YarnTextBuilder` and utilities
- Abstract methods: `exportNode`, `importNode`

**File**: `src/lib/yarn-converter/registry.ts`

- `NodeHandlerRegistry` class
- Maps `ForgeNodeType` to handlers
- `getHandler(nodeType: ForgeNodeType): NodeHandler`

### Phase 5: Implement Node Handlers

**File**: `src/lib/yarn-converter/handlers/character-handler.ts`

- Uses `YarnTextBuilder` for transparent text generation
- Clear formatting of content, speaker, conditionals, flags, jumps
- Easy to see exactly what Yarn text is produced

**File**: `src/lib/yarn-converter/handlers/player-handler.ts`

- Uses `YarnTextBuilder` for choices
- Clear formatting of options, conditions, flags, jumps

**File**: `src/lib/yarn-converter/handlers/conditional-handler.ts`

- Uses `YarnTextBuilder` for conditional blocks
- Clear formatting of if/elseif/else/endif

**File**: `src/lib/yarn-converter/handlers/storylet-handler.ts`

- Uses workspace context to fetch referenced graph
- Checks cache first via `getGraphFromCache`
- If not in cache, uses `ensureGraph` (which uses workspace store's cache-first resolver)
- Recursively exports referenced graph's nodes
- Uses `visitedGraphs` to prevent cycles
- Inlines nodes into current Yarn file
- Clear formatting of storylet node and inlined content

**File**: `src/lib/yarn-converter/handlers/detour-handler.ts`

- Similar to storylet-handler
- Handles `DETOUR_RETURN` mode
- Manages return node logic

### Phase 6: Create Main Converter Functions

**File**: `src/lib/yarn-converter/index.ts`

- `exportToYarn(graph: ForgeGraphDoc, context?: YarnConverterContext): Promise<string>`
  - Create `YarnTextBuilder` instance
  - Iterate through `graph.flow.nodes`
  - Get handler from registry
  - Call `handler.exportNode(node, builder, context)`
  - Build final Yarn string
- `importFromYarn(yarnContent: string, title?: string): Promise<ForgeGraphDoc>`
  - Parse Yarn into node blocks
  - Determine node type from content
  - Get handler from registry
  - Call `handler.importNode(yarnBlock)`
  - Build `ForgeGraphDoc`

### Phase 7: Add Yarn Spinner Documentation

**File**: `src/lib/yarn-converter/docs/` (all markdown files)

- Scrape/copy from Yarn Spinner docs
- Reference in JSDoc comments
- Link from handler implementations

### Phase 8: Update Imports and Migration

**File**: `src/lib/yarn-converter.ts` (deprecated)

- Re-export from new location for backward compatibility
- Add deprecation notice

**Update**: All files importing yarn-converter

- Update to use new async API
- Pass workspace store context when available

## Benefits

- **Transparency**: Clear visibility of how Yarn text is generated
- **Maintainability**: String formatting centralized in builders
- **Extensibility**: Easy to add new node types and Yarn features
- **Integration**: Uses existing workspace store pattern (no duplication)
- **Type Safety**: Strong typing throughout
- **Documentation**: Yarn Spinner features documented locally
- **Testability**: Handlers and builders testable independently

## Migration Notes

- `exportToYarn` becomes async (for storylet/detour graph fetching)
- Context is optional (backward compatible)
- When workspace store available, pass it for cache-first resolution
- All Yarn syntax constants in one place for easy updates