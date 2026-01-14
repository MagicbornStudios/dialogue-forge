# ForgeGraphDoc Direct Execution Analysis

## Overview

This document analyzes executing `ForgeGraphDoc` directly without converting to Yarn Spinner format.

## Current GamePlayer Implementation

The current `GamePlayer` component is minimal:
- Renders `VNStage` UI component
- Receives `ForgeGraphDoc` as prop
- No execution logic implemented

## Direct Execution Approach

### Execution Flow

```
ForgeGraphDoc
    ↓
Start at startNodeId
    ↓
Get current node from flow.nodes
    ↓
Execute node based on type:
    - CHARACTER: Display content, evaluate conditions, set flags, jump to nextNodeId
    - PLAYER: Display choices, evaluate conditions, wait for selection, jump to choice.nextNodeId
    - CONDITIONAL: Evaluate blocks, execute matching block, jump to block.nextNodeId
    - STORYLET: Resolve referenced graph, execute it, return to returnNodeId
    - DETOUR: Resolve referenced graph, execute it, return to returnNodeId
    ↓
Update game state (flags, variables)
    ↓
Continue to next node
```

### Node Execution Patterns

### Visual Scene Integration (BabylonJS)

Node execution may emit **Scene Cues** that drive the Babylon scene runtime. This is presentation-only and does not affect routing.

**Behavior A (MVP):**
- CHARACTER nodes: apply `sceneCues` (if any) then display dialogue.
- PLAYER nodes: evaluate conditions, display choices overlay; scene remains unchanged by default.
- CONDITIONAL nodes: route only; no visual changes.
- STORYLET/DETOUR nodes: may switch scene scope depending on storylet visual policy (inherit vs override, restore vs persist).

See: `gameplayer-babylonjs.md` for cue types and storylet enter/exit policies.



**CHARACTER Node:**
```typescript
function executeCharacterNode(node: ForgeFlowNode, gameState: ForgeGameState) {
  // Display content
  displayContent(node.data.content, node.data.speaker);
  
  // Execute setFlags
  if (node.data.setFlags) {
    node.data.setFlags.forEach(flag => {
      gameState.flags[flag] = true;
    });
  }
  
  // Evaluate conditional blocks if present
  if (node.data.conditionalBlocks) {
    const matchingBlock = evaluateConditionalBlocks(node.data.conditionalBlocks, gameState);
    if (matchingBlock) {
      displayContent(matchingBlock.content, matchingBlock.speaker);
      if (matchingBlock.setFlags) {
        matchingBlock.setFlags.forEach(flag => {
          gameState.flags[flag] = true;
        });
      }
      return matchingBlock.nextNodeId || node.data.defaultNextNodeId;
    }
  }
  
  // Jump to next node
  return node.data.defaultNextNodeId;
}
```

**PLAYER Node:**
```typescript
function executePlayerNode(node: ForgeFlowNode, gameState: ForgeGameState) {
  // Filter choices by conditions
  const availableChoices = node.data.choices?.filter(choice => {
    if (!choice.conditions) return true;
    return evaluateConditions(choice.conditions, gameState);
  }) || [];
  
  // Display choices
  displayChoices(availableChoices);
  
  // Wait for player selection
  return waitForChoice(availableChoices);
}
```

**CONDITIONAL Node:**
```typescript
function executeConditionalNode(node: ForgeFlowNode, gameState: ForgeGameState) {
  // Evaluate blocks in order
  for (const block of node.data.conditionalBlocks || []) {
    if (block.type === 'else' || evaluateConditions(block.condition || [], gameState)) {
      // Execute matching block
      displayContent(block.content, block.speaker);
      if (block.setFlags) {
        block.setFlags.forEach(flag => {
          gameState.flags[flag] = true;
        });
      }
      return block.nextNodeId;
    }
  }
  
  // No matching block
  return null;
}
```

**STORYLET/DETOUR Node:**
```typescript
async function executeStoryletNode(node: ForgeFlowNode, gameState: ForgeGameState, context: ExecutionContext) {
  // Resolve referenced graph
  const referencedGraph = await context.resolveGraph(node.data.storyletCall.targetGraphId);
  
  // Execute referenced graph
  const result = await executeGraph(referencedGraph, gameState, context);
  
  // Return to returnNodeId (for detours) or continue
  return node.data.storyletCall.returnNodeId || node.data.defaultNextNodeId;
}
```

### Condition Evaluation

```typescript
function evaluateConditions(conditions: ForgeCondition[], gameState: ForgeGameState): boolean {
  return conditions.every(condition => {
    const value = gameState.flags[condition.flag];
    
    switch (condition.operator) {
      case CONDITION_OPERATOR.IS_SET:
        return value !== undefined && value !== false;
      case CONDITION_OPERATOR.IS_NOT_SET:
        return value === undefined || value === false;
      case CONDITION_OPERATOR.EQUALS:
        return value === condition.value;
      case CONDITION_OPERATOR.NOT_EQUALS:
        return value !== condition.value;
      case CONDITION_OPERATOR.GREATER_THAN:
        return Number(value) > Number(condition.value);
      case CONDITION_OPERATOR.LESS_THAN:
        return Number(value) < Number(condition.value);
      case CONDITION_OPERATOR.GREATER_EQUAL:
        return Number(value) >= Number(condition.value);
      case CONDITION_OPERATOR.LESS_EQUAL:
        return Number(value) <= Number(condition.value);
      default:
        return false;
    }
  });
}
```

### Variable Management

```typescript
interface ExecutionState {
  currentNodeId: string | null;
  gameState: ForgeGameState;
  callStack: Array<{ graphId: string; returnNodeId: string }>; // For storylets/detours
  visitedNodes: Set<string>; // For cycle detection
}
```

## Advantages

1. **Full Control**: Complete control over execution
2. **No Conversion**: Direct execution, no Yarn conversion needed
3. **Customization**: Easy to add custom features
4. **Performance**: No conversion overhead
5. **Native Integration**: Works directly with ForgeGraphDoc structure
6. **Debugging**: Easier to debug (native data structures)

## Disadvantages

1. **Maintenance**: Must maintain execution logic
2. **Parity Risk**: May diverge from Yarn Spinner behavior
3. **Bugs**: Potential for bugs in custom implementation
4. **Feature Gaps**: May miss Yarn Spinner edge cases
5. **Testing**: Must test all execution paths

## Customization Opportunities

1. **Custom Node Types**: Easy to add new node types
2. **Custom Commands**: Add custom execution commands
3. **Custom Functions**: Add custom condition functions
4. **Performance Optimizations**: Optimize for specific use cases
5. **Debugging Tools**: Built-in debugging and visualization

## Implementation Considerations

### State Management

- Use React state or Zustand for execution state
- Track current node, game state, call stack
- Handle async operations (graph resolution)

### Error Handling

- Invalid node references
- Circular references
- Missing nodes
- Type mismatches

### Performance

- Node lookup optimization (Map by ID)
- Condition evaluation caching
- Lazy graph loading

## Research Questions

1. ✅ Can we execute ForgeGraphDoc without converting to Yarn? **Yes**
2. ✅ What would execution look like? **See patterns above**
3. ✅ How would variables be managed? **Via ForgeGameState**
4. ✅ How would commands be handled? **Direct execution in handlers**
5. ✅ What customization would be possible? **See customization section**
6. ✅ How to handle storylet/detour nodes? **Graph resolution and call stack**
7. ✅ How to handle conditional blocks? **Condition evaluation**
8. ✅ How to handle player choices? **Filter by conditions, wait for selection**

## Next Steps

1. Prototype basic execution engine
2. Test with sample graphs
3. Benchmark performance
4. Compare with Yarn VM approach
