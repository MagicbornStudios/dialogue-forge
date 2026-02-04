# Extending the Yarn Converter

## Step-by-Step Guide to Add a New Node Type

This guide walks through adding a new "Cutscene" node type to the Yarn converter.

### Step 1: Define the Node Type

First, ensure your node type is defined in the type system:

```typescript
// src/types/forge/forge-graph.ts
export const FORGE_NODE_TYPE = {
  // ... existing types
  CUTSCENE: 'CUTSCENE',
} as const;
```

### Step 2: Create the Handler Class

Create a new handler file:

```typescript
// src/lib/yarn-converter/handlers/cutscene-handler.ts
import { BaseNodeHandler } from './base-handler';
import { NodeBlockBuilder } from '../builders/node-block-builder';
import type { ForgeReactFlowNode, ForgeNodeType, ForgeNode } from '@magicborn/forge/types/forge-graph';
import type { YarnConverterContext, YarnNodeBlock } from '../types';
import { FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';

export class CutsceneHandler extends BaseNodeHandler {
  canHandle(nodeType: ForgeNodeType): boolean {
    return nodeType === FORGE_NODE_TYPE.CUTSCENE;
  }

  async exportNode(
    node: ForgeReactFlowNode,
    builder: import('../types').YarnTextBuilder,
    context?: YarnConverterContext
  ): Promise<string> {
    const data = this.getNodeData(node);
    const blockBuilder = new NodeBlockBuilder(node.id || 'unknown');

    blockBuilder.startNode();

    // Export cutscene-specific content
    if (data.content) {
      blockBuilder.addContent(data.content, data.speaker);
    }

    // Export any flags
    if (data.setFlags?.length) {
      blockBuilder.addFlags(data.setFlags);
    }

    // Export next node
    if (data.defaultNextNodeId) {
      blockBuilder.addNextNode(data.defaultNextNodeId);
    }

    return blockBuilder.endNode();
  }

  async importNode(
    yarnBlock: YarnNodeBlock,
    context?: YarnConverterContext
  ): Promise<ForgeReactFlowNode> {
    const lines = yarnBlock.lines;
    let content = '';
    let speaker = '';
    const setFlags: string[] = [];
    let nextNodeId = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('<<jump')) {
        const jumpMatch = trimmed.match(/<<jump\s+(\S+)>>/);
        if (jumpMatch) {
          nextNodeId = jumpMatch[1];
        }
      } else if (trimmed.startsWith('<<set')) {
        const setMatch = trimmed.match(/<<set\s+\$(\w+)/);
        if (setMatch) {
          setFlags.push(setMatch[1]);
        }
      } else if (trimmed.includes(':') && !trimmed.startsWith('<<')) {
        const [spk, ...rest] = trimmed.split(':');
        speaker = spk.trim();
        content += rest.join(':').trim() + '\n';
      } else if (!trimmed.startsWith('<<')) {
        content += trimmed + '\n';
      }
    });

    const nodeData: ForgeNode = {
      id: yarnBlock.nodeId,
      type: FORGE_NODE_TYPE.CUTSCENE,
      speaker: speaker || undefined,
      content: content.trim(),
      defaultNextNodeId: nextNodeId || undefined,
      setFlags: setFlags.length > 0 ? setFlags : undefined,
    };

    return {
      id: yarnBlock.nodeId,
      type: FORGE_NODE_TYPE.CUTSCENE,
      position: { x: 0, y: 0 },
      data: nodeData,
    };
  }
}
```

### Step 3: Register the Handler

Register your handler in the main converter file:

```typescript
// src/lib/yarn-converter/index.ts
import { CutsceneHandler } from './handlers/cutscene-handler';

// Register handler
const cutsceneHandler = new CutsceneHandler();
defaultRegistry.registerHandler(FORGE_NODE_TYPE.CUTSCENE, cutsceneHandler);
```

### Step 4: Update Type Detection (for Import)

Update the `determineNodeTypeFromYarn` function to recognize your node type:

```typescript
// src/lib/yarn-converter/index.ts
function determineNodeTypeFromYarn(block: YarnNodeBlock): ForgeNodeType | null {
  // ... existing detection logic
  
  // Add detection for cutscene nodes
  const hasCutsceneMarker = block.lines.some(line => 
    line.includes('[CUTSCENE]') || line.includes('<<cutscene>>')
  );
  
  if (hasCutsceneMarker) {
    return FORGE_NODE_TYPE.CUTSCENE;
  }
  
  // ... rest of detection
}
```

### Step 5: Write Tests

Create comprehensive tests for your handler:

```typescript
// src/lib/yarn-converter/__tests__/cutscene-handler.test.ts
import { describe, it, expect } from 'vitest';
import { CutsceneHandler } from '../handlers/cutscene-handler';
import { YarnTextBuilder } from '../builders/yarn-text-builder';
import { createSimpleCharacterNode, parseYarnNode } from './helpers';
import { FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';

describe('CutsceneHandler', () => {
  let handler: CutsceneHandler;
  let builder: YarnTextBuilder;

  beforeEach(() => {
    handler = new CutsceneHandler();
    builder = new YarnTextBuilder();
  });

  describe('exportNode', () => {
    it('should export cutscene content', async () => {
      const node = createSimpleCharacterNode('cutscene1', 'Cutscene content', 'Narrator');
      node.data!.type = FORGE_NODE_TYPE.CUTSCENE;
      
      const result = await handler.exportNode(node, builder);
      
      expect(result).toContain('title: cutscene1');
      expect(result).toContain('Narrator: Cutscene content');
    });
  });

  describe('importNode', () => {
    it('should import cutscene node', async () => {
      const yarnBlock = parseYarnNode(`title: cutscene1
---
Narrator: Cutscene content
===`);
      
      const result = await handler.importNode(yarnBlock);
      
      expect(result.data?.type).toBe(FORGE_NODE_TYPE.CUTSCENE);
      expect(result.data?.content).toBe('Cutscene content');
    });
  });

  describe('round-trip', () => {
    it('should round-trip cutscene node', async () => {
      const node = createSimpleCharacterNode('cutscene1', 'Content', 'Narrator');
      node.data!.type = FORGE_NODE_TYPE.CUTSCENE;
      
      const exported = await handler.exportNode(node, builder);
      const yarnBlock = parseYarnNode(exported);
      const imported = await handler.importNode(yarnBlock);
      
      expect(imported.data?.content).toBe(node.data?.content);
      expect(imported.data?.speaker).toBe(node.data?.speaker);
    });
  });
});
```

### Step 6: Testing Checklist

- [ ] Handler exports node correctly
- [ ] Handler imports node correctly
- [ ] Round-trip preserves all data
- [ ] Edge cases handled (empty content, missing fields)
- [ ] Integration test passes
- [ ] Documentation updated

## Best Practices

1. **Use BaseNodeHandler**: Extend `BaseNodeHandler` for common functionality
2. **Use Builders**: Use `NodeBlockBuilder` and `YarnTextBuilder` for consistent formatting
3. **Handle Edge Cases**: Empty content, missing fields, malformed Yarn
4. **Test Thoroughly**: Export, import, and round-trip tests
5. **Follow Patterns**: Look at existing handlers for patterns
6. **Use Constants**: Always use `FORGE_NODE_TYPE`, `CONDITION_OPERATOR`, etc.

## Common Patterns

### Pattern 1: Simple Content Node

```typescript
// Export content, speaker, flags, nextNodeId
blockBuilder.startNode();
blockBuilder.addContent(data.content, data.speaker);
if (data.setFlags?.length) {
  blockBuilder.addFlags(data.setFlags);
}
if (data.defaultNextNodeId) {
  blockBuilder.addNextNode(data.defaultNextNodeId);
}
return blockBuilder.endNode();
```

### Pattern 2: Node with Choices

```typescript
// Export choices
blockBuilder.startNode();
if (data.choices?.length) {
  blockBuilder.addChoices(data.choices);
}
return blockBuilder.endNode();
```

### Pattern 3: Node with Conditionals

```typescript
// Export conditional blocks
blockBuilder.startNode();
if (data.conditionalBlocks?.length) {
  blockBuilder.addConditionalBlocks(data.conditionalBlocks);
}
return blockBuilder.endNode();
```

## Template Handler

Use this template as a starting point:

```typescript
import { BaseNodeHandler } from './base-handler';
import { NodeBlockBuilder } from '../builders/node-block-builder';
import type { ForgeReactFlowNode, ForgeNodeType, ForgeNode } from '@magicborn/forge/types/forge-graph';
import type { YarnConverterContext, YarnNodeBlock } from '../types';
import { FORGE_NODE_TYPE } from '@magicborn/forge/types/forge-graph';

export class YourNodeHandler extends BaseNodeHandler {
  canHandle(nodeType: ForgeNodeType): boolean {
    return nodeType === FORGE_NODE_TYPE.YOUR_TYPE;
  }

  async exportNode(
    node: ForgeReactFlowNode,
    builder: import('../types').YarnTextBuilder,
    context?: YarnConverterContext
  ): Promise<string> {
    const data = this.getNodeData(node);
    const blockBuilder = new NodeBlockBuilder(node.id || 'unknown');

    blockBuilder.startNode();
    
    // TODO: Add your export logic here
    
    return blockBuilder.endNode();
  }

  async importNode(
    yarnBlock: YarnNodeBlock,
    context?: YarnConverterContext
  ): Promise<ForgeReactFlowNode> {
    // TODO: Add your import logic here
    
    const nodeData: ForgeNode = {
      id: yarnBlock.nodeId,
      type: FORGE_NODE_TYPE.YOUR_TYPE,
      // TODO: Add your node data fields
    };

    return {
      id: yarnBlock.nodeId,
      type: FORGE_NODE_TYPE.YOUR_TYPE,
      position: { x: 0, y: 0 },
      data: nodeData,
    };
  }
}
```

