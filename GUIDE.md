# Dialogue Forge Guide

> **Welcome!** This guide will help you integrate Dialogue Forge into your application and create interactive dialogues that work seamlessly with Yarn Spinner.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Advanced Features](#advanced-features)
3. [Understanding Flags and Variables](#understanding-flags-and-variables)
4. [Node Types](#node-types)
5. [Working with Yarn Spinner](#working-with-yarn-spinner)
6. [Tips & Best Practices](#tips--best-practices)

---

## Quick Start

### Installation

```bash
npm install @portfolio/dialogue-forge
# or
yarn add @portfolio/dialogue-forge
```

### Basic Integration

```tsx
import React, { useState } from 'react';
import { DialogueEditorV2 } from '@portfolio/dialogue-forge';
import { DialogueTree, FlagSchema } from '@portfolio/dialogue-forge/types';

// Define your flag schema
const flagSchema: FlagSchema = {
  flags: [
    {
      id: 'quest_complete',
      name: 'Quest Complete',
      type: 'quest',
    },
    {
      id: 'stat_gold',
      name: 'Gold',
      type: 'stat',
      valueType: 'number',
      defaultValue: 0,
    },
  ],
};

// Create an initial dialogue
const initialDialogue: DialogueTree = {
  title: 'My Dialogue',
  startNodeId: 'start',
  nodes: {
    start: {
      id: 'start',
      type: 'npc',
      content: 'Hello! Welcome to my shop.',
      speaker: 'Merchant',
      nextNodeId: 'choice',
      x: 0,
      y: 0,
    },
    choice: {
      id: 'choice',
      type: 'player',
      choices: [
        {
          id: 'c1',
          text: 'Buy something',
          nextNodeId: 'buy',
        },
        {
          id: 'c2',
          text: 'Leave',
          nextNodeId: 'end',
        },
      ],
      x: 0,
      y: 200,
    },
    buy: {
      id: 'buy',
      type: 'npc',
      content: 'What would you like to buy?',
      speaker: 'Merchant',
      x: 0,
      y: 400,
    },
    end: {
      id: 'end',
      type: 'npc',
      content: 'Goodbye!',
      speaker: 'Merchant',
      x: 200,
      y: 400,
    },
  },
};

function MyApp() {
  const [dialogue, setDialogue] = useState<DialogueTree>(initialDialogue);
  const [flags, setFlags] = useState<FlagSchema>(flagSchema);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <DialogueEditorV2
        dialogue={dialogue}
        onChange={(updated) => setDialogue(updated)}
        flagSchema={flags}
        onExportYarn={(yarn) => {
          // Handle Yarn export
          console.log('Exported Yarn:', yarn);
          // Download or send to server
        }}
      />
    </div>
  );
}

export default MyApp;
```

### Importing Existing Yarn Files

```tsx
import { importFromYarn } from '@portfolio/dialogue-forge';

// Load a Yarn file
const yarnContent = `
title: merchant_shop
---
Merchant: Welcome to my shop!
-> Buy sword
    Merchant: That will be 100 gold.
    <<jump after_purchase>>
-> Leave
    Merchant: Goodbye!
    <<jump end>>
===
`;

const dialogue = importFromYarn(yarnContent, 'merchant_shop');
setDialogue(dialogue);
```

### Exporting to Yarn

```tsx
import { exportToYarn } from '@portfolio/dialogue-forge';

const handleExport = () => {
  const yarnContent = exportToYarn(dialogue);
  
  // Download as file
  const blob = new Blob([yarnContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${dialogue.title}.yarn`;
  a.click();
  
  // Or send to server
  fetch('/api/dialogue/export', {
    method: 'POST',
    body: JSON.stringify({ yarn: yarnContent }),
  });
};
```

---

## Advanced Features

### Custom Flag Management

```tsx
import { FlagManager } from '@portfolio/dialogue-forge';

function MyApp() {
  const [showFlagManager, setShowFlagManager] = useState(false);
  const [flagSchema, setFlagSchema] = useState<FlagSchema>(initialFlags);

  return (
    <>
      <button onClick={() => setShowFlagManager(true)}>
        Manage Flags
      </button>
      
      {showFlagManager && (
        <FlagManager
          flagSchema={flagSchema}
          dialogue={dialogue}
          onUpdate={(updated) => setFlagSchema(updated)}
          onClose={() => setShowFlagManager(false)}
        />
      )}
    </>
  );
}
```

### Custom Layout Strategies

```tsx
import { applyLayout, layoutRegistry } from '@portfolio/dialogue-forge/utils/layout';

// Apply a specific layout
const layouted = applyLayout(dialogue, 'dagre', { direction: 'TB' });

// Register a custom layout strategy
import { LayoutStrategy } from '@portfolio/dialogue-forge/utils/layout';

class MyCustomLayout implements LayoutStrategy {
  readonly id = 'my-custom';
  readonly name = 'My Custom Layout';
  readonly description = 'A custom layout algorithm';

  apply(dialogue: DialogueTree, options?: LayoutOptions): LayoutResult {
    // Your layout logic here
    const updatedNodes = { ...dialogue.nodes };
    // Calculate positions...
    return { dialogue: { ...dialogue, nodes: updatedNodes } };
  }
}

layoutRegistry.register(new MyCustomLayout());
```

### Programmatic Node Creation

```tsx
import { DialogueNode, NODE_TYPE } from '@portfolio/dialogue-forge/types';

// Create an NPC node
const npcNode: DialogueNode = {
  id: 'merchant_greeting',
  type: NODE_TYPE.NPC,
  content: 'Welcome to my shop!',
  speaker: 'Merchant',
  nextNodeId: 'choice',
  x: 100,
  y: 100,
  setFlags: ['dialogue_met_merchant'],
};

// Create a player choice node
const playerNode: DialogueNode = {
  id: 'choice',
  type: NODE_TYPE.PLAYER,
  choices: [
    {
      id: 'c1',
      text: 'Buy something',
      nextNodeId: 'buy',
      conditions: [{ flag: 'stat_gold', operator: '>=', value: 100 }],
      setFlags: ['item_sword'],
    },
    {
      id: 'c2',
      text: 'Leave',
      nextNodeId: 'end',
    },
  ],
  x: 100,
  y: 300,
};

// Add to dialogue
const updatedDialogue = {
  ...dialogue,
  nodes: {
    ...dialogue.nodes,
    [npcNode.id]: npcNode,
    [playerNode.id]: playerNode,
  },
};
```

### Variable Operations

```tsx
// In dialogue content, you can use variable operations:
const dialogueWithOps: DialogueTree = {
  // ...
  nodes: {
    merchant: {
      id: 'merchant',
      type: NODE_TYPE.NPC,
      content: 'You have {$stat_gold} gold. <<set $stat_gold += 100>> Here is 100 more!',
      // When processed, this will:
      // 1. Interpolate {$stat_gold} with the current value
      // 2. Execute <<set $stat_gold += 100>> to increment
      // 3. Display: "You have 500 gold. Here is 100 more!"
    },
  },
};
```

### Conditional Blocks

```tsx
const conditionalNode: DialogueNode = {
  id: 'conditional',
  type: NODE_TYPE.CONDITIONAL,
  conditionalBlocks: [
    {
      id: 'block1',
      condition: [{ flag: 'quest_complete', operator: '==', value: true }],
      content: 'You have completed the quest!',
      nextNodeId: 'reward',
    },
    {
      id: 'block2',
      condition: [{ flag: 'quest_complete', operator: '==', value: false }],
      content: 'The quest is not yet complete.',
      nextNodeId: 'continue',
    },
  ],
  x: 100,
  y: 100,
};
```

### Running Dialogues with ScenePlayer

```tsx
import { ScenePlayer, ScenePlayerProps } from '@portfolio/dialogue-forge';

// Define game state (can be any JSON structure)
interface GameState {
  flags: {
    quest_complete: boolean;
    stat_gold: number;
  };
  player: {
    name: string;
    level: number;
  };
  // ... any other game data
}

const [gameState, setGameState] = useState<GameState>({
  flags: {
    quest_complete: false,
    stat_gold: 1000,
  },
  player: {
    name: 'Hero',
    level: 5,
  },
});

<ScenePlayer
  dialogue={dialogue}
  gameState={gameState} // Pass full game state
  onComplete={(result) => {
    // Update game state with new flags
    setGameState(prev => ({
      ...prev,
      flags: { ...prev.flags, ...result.updatedFlags }
    }));
  }}
  // Event hooks
  onNodeEnter={(nodeId, node) => {
    console.log('Entered node:', nodeId);
    // Trigger animations, sound effects, etc.
  }}
  onNodeExit={(nodeId, node) => {
    console.log('Exited node:', nodeId);
  }}
  onChoiceSelect={(nodeId, choice) => {
    console.log('Selected choice:', choice.text);
    // Track player decisions
  }}
  onDialogueStart={() => {
    console.log('Dialogue started');
  }}
  onDialogueEnd={() => {
    console.log('Dialogue ended');
  }}
/>
```

### Running Dialogues Programmatically

```tsx
import { 
  VariableManager, 
  processNode, 
  DialogueTree 
} from '@portfolio/dialogue-forge/lib/yarn-runner';

function runDialogue(dialogue: DialogueTree, gameFlags: Record<string, any>) {
  const variableManager = new VariableManager();
  
  // Set initial game flags
  Object.entries(gameFlags).forEach(([key, value]) => {
    variableManager.set(key, value);
  });
  
  let currentNodeId = dialogue.startNodeId;
  const history: Array<{ speaker?: string; content: string }> = [];
  
  while (currentNodeId) {
    const node = dialogue.nodes[currentNodeId];
    if (!node) break;
    
    const result = processNode(node, variableManager);
    
    if (result.content) {
      history.push({
        speaker: result.speaker,
        content: result.content,
      });
    }
    
    // Handle player choices
    if (result.isPlayerChoice && result.choices) {
      // Display choices to user, wait for selection
      const selectedChoice = await getUserChoice(result.choices);
      currentNodeId = selectedChoice.nextNodeId;
    } else {
      currentNodeId = result.nextNodeId;
    }
    
    if (result.isEnd) break;
  }
  
  return {
    history,
    finalFlags: variableManager.getAllVariables(),
  };
}
```

### Custom Node Types

```tsx
import { NodeProps } from 'reactflow';
import { DialogueNode } from '@portfolio/dialogue-forge/types';

interface CustomNodeData {
  node: DialogueNode;
  // Your custom data
}

function CustomNode({ data, selected }: NodeProps<CustomNodeData>) {
  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
      <div>{data.node.content}</div>
      {/* Your custom rendering */}
    </div>
  );
}

// Register in DialogueEditorV2
const customNodeTypes = {
  custom: CustomNode,
  // ... other node types
};
```

### Event Handlers

```tsx
<DialogueEditorV2
  dialogue={dialogue}
  onChange={(updated) => {
    // Handle dialogue changes
    console.log('Dialogue updated:', updated);
    setDialogue(updated);
  }}
  onNodeClick={(nodeId) => {
    // Handle node selection
    console.log('Node clicked:', nodeId);
  }}
  onExportYarn={(yarn) => {
    // Handle Yarn export
    saveToFile(yarn);
  }}
  onLoadExampleDialogue={(example) => {
    // Handle example loading (debug mode only)
    setDialogue(example);
  }}
  onLoadExampleFlags={(flags) => {
    // Handle flag schema loading (debug mode only)
    setFlagSchema(flags);
  }}
/>
```

### Disabling Debug Tools

```tsx
// In your build process or environment config
import { ENABLE_DEBUG_TOOLS } from '@portfolio/dialogue-forge/utils/feature-flags';

// Set to false in production
// ENABLE_DEBUG_TOOLS = false;

// Or override in your app:
import { featureFlags } from '@portfolio/dialogue-forge/utils/feature-flags';
featureFlags.ENABLE_DEBUG_TOOLS = process.env.NODE_ENV === 'development';
```

---

## Understanding Flags and Variables

### The Key Concept

**Flags in Dialogue Forge = Variables in Yarn Spinner**

When you set a flag in Dialogue Forge, it becomes a Yarn variable (like `$quest_complete`). These variables are **not stored in the .yarn file** - they're managed by Yarn Spinner's variable storage system at runtime.

### Flag Types

```tsx
import { FlagType } from '@portfolio/dialogue-forge/types/flags';

const flagTypes: Record<FlagType, string> = {
  dialogue: 'Temporary - resets after dialogue ends',
  quest: 'Persistent - tracks quest progress',
  achievement: 'Persistent - tracks achievements',
  item: 'Persistent - tracks inventory',
  stat: 'Persistent - tracks player stats',
  title: 'Persistent - tracks player titles',
  global: 'Persistent - global game state',
};
```

### Variable Operations

Supported operations:
- `=` - Assignment: `<<set $stat_gold = 100>>`
- `+=` - Addition: `<<set $stat_gold += 50>>`
- `-=` - Subtraction: `<<set $stat_gold -= 25>>`
- `*=` - Multiplication: `<<set $stat_gold *= 2>>`
- `/=` - Division: `<<set $stat_gold /= 2>>`

### Variable Interpolation

Display variable values in dialogue:

```yarn
Merchant: "You currently have {$stat_gold} gold pieces."
```

This will show the actual value of `$stat_gold` when the dialogue runs.

---

## Node Types

### NPC Node

An NPC speaks to the player.

```tsx
const npcNode: DialogueNode = {
  id: 'merchant',
  type: NODE_TYPE.NPC,
  content: 'Welcome to my shop!',
  speaker: 'Merchant',
  nextNodeId: 'choice',
  setFlags: ['dialogue_met_merchant'],
  x: 0,
  y: 0,
};
```

### Player Node

Player makes a choice.

```tsx
const playerNode: DialogueNode = {
  id: 'choice',
  type: NODE_TYPE.PLAYER,
  choices: [
    {
      id: 'c1',
      text: 'Buy sword',
      nextNodeId: 'purchase',
      conditions: [{ flag: 'stat_gold', operator: '>=', value: 100 }],
      setFlags: ['item_sword'],
    },
    {
      id: 'c2',
      text: 'Leave',
      nextNodeId: 'end',
    },
  ],
  x: 0,
  y: 200,
};
```

### Conditional Node

Branch based on conditions.

```tsx
const conditionalNode: DialogueNode = {
  id: 'conditional',
  type: NODE_TYPE.CONDITIONAL,
  conditionalBlocks: [
    {
      id: 'block1',
      condition: [{ flag: 'quest_complete', operator: '==', value: true }],
      content: 'Quest complete!',
      nextNodeId: 'reward',
    },
    {
      id: 'block2',
      condition: [], // Default/else block
      content: 'Quest not complete.',
      nextNodeId: 'continue',
    },
  ],
  x: 0,
  y: 400,
};
```

---

## Working with Yarn Spinner

### Exporting to Unreal Engine

1. Export your dialogue to Yarn format
2. Import the `.yarn` file into your Yarn Spinner project in Unreal
3. Yarn Spinner handles all variable storage automatically

### Variable Storage

Yarn Spinner's Unreal plugin uses a **Variable Storage** component that:
- Stores all `$variable` values
- Persists across dialogue sessions
- Can be accessed from Blueprints/C++

**Important**: Variables are stored in the Variable Storage, **not in the .yarn file**. The .yarn file only contains the commands to set/check them.

### Example: Quest System

```yarn
title: quest_offer
---
NPC: "Will you help slay the dragon?"
-> "Yes, I'll help!"
    <<set $quest_dragon_slayer = "started">>
    <<jump quest_started>>
-> "Not right now"
    <<jump quest_declined>>
===
```

In Unreal:
1. Player selects "Yes, I'll help!"
2. Yarn Spinner sets `$quest_dragon_slayer = "started"` in Variable Storage
3. Your game code can read this: `GetVariableStorage()->GetValue("quest_dragon_slayer")`
4. Later dialogues can check: `<<if $quest_dragon_slayer == "started">>`

---

## Tips & Best Practices

### Flag Naming

Use prefixes to organize:
- `quest_*` - Quest-related flags
- `item_*` - Inventory items
- `stat_*` - Player statistics
- `dialogue_*` - Temporary dialogue memory

### Node IDs

Use descriptive IDs:
- ✅ `merchant_greeting`
- ✅ `quest_dragon_accept`
- ❌ `node1`, `node2`

### Testing

- Use **Play View** to test your dialogue
- Use **Debug Flags** panel to see flag changes
- Test different flag states to see conditional choices

### Exporting

- Export frequently to save your work
- The `.yarn` file is what Unreal uses
- Flag schemas are separate (export/import them too!)

---

## Keyboard Shortcuts

- **Delete/Backspace** - Delete selected node
- **Escape** - Close menus, deselect
- **Scroll** - Zoom in/out
- **Double-click node** - Zoom to node
- **Double-click pane** - Fit view to all nodes
- **Right-click** - Context menu
- **Drag ports** - Connect nodes

---

## Next Steps

- Check out the **Examples** (debug tool) to see working dialogues
- Read [DATA_STRUCTURES.md](./DATA_STRUCTURES.md) for type reference
- Read [INTEGRATION.md](./INTEGRATION.md) for detailed integration guide
- Read [LAYOUT_STRATEGIES.md](./LAYOUT_STRATEGIES.md) for custom layout algorithms

---

## Common Questions

**Q: Do flags live in the .yarn file?**  
A: No! Flags are converted to Yarn variables (`$variable`), which are stored in Yarn Spinner's Variable Storage at runtime, not in the file.

**Q: How do I sync flags between Dialogue Forge and Unreal?**  
A: Export your Flag Schema (JSON) and import it into your game. The flag IDs should match the variable names in Yarn.

**Q: Can I use existing Yarn files?**  
A: Yes! Import `.yarn` files and edit them visually. Variables in the file will be detected.

**Q: How do conditions work in Unreal?**  
A: Yarn Spinner evaluates `<<if>>` statements using its Variable Storage. Your conditions export as Yarn conditionals.

**Q: How do I disable debug tools in production?**  
A: Set `ENABLE_DEBUG_TOOLS = false` in `src/utils/feature-flags.ts` or override it in your build process.
